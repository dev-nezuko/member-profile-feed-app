import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { RequestWithUserId } from '../types/express';

const prisma = new PrismaClient();

export const getProfile = async (req: RequestWithUserId, res: Response) => {
  const profile = await prisma.profile.findUnique({
    where: { userId: req.userId },
  });

  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const host = `${req.protocol}://${req.get('host')}`;

  res.json({
    ...profile,
    photoUrl: profile.photoUrl ? `${host}${profile.photoUrl}` : null,
  });
};

export const updateProfile = async (req: RequestWithUserId, res: Response) => {
  const { name, headline, bio, interests } = req.body;
  const filePath = req.file ? `/uploads/${req.file.filename}` : undefined;

  const data: any = {
    name,
    headline,
    bio,
    interests: interests?.split(',').map((tag: string) => tag.trim()),
    userId: req.userId!,
  };

  if (filePath) data.photoUrl = filePath;

  const existing = await prisma.profile.findUnique({ where: { userId: req.userId } });

  const profile = existing
    ? await prisma.profile.update({ where: { userId: req.userId }, data })
    : await prisma.profile.create({ data });

  res.json(profile);
};

export const deleteProfile = async (req: RequestWithUserId, res: Response) => {
  await prisma.profile.delete({ where: { userId: req.userId } });
  res.json({ message: 'Deleted' });
};

export const getFeed = async (req: RequestWithUserId, res: Response) => {
  const { page = '1', limit = '5' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const profiles = await prisma.profile.findMany({
    where: { userId: { not: req.userId! } },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
    include: { likes: true },
  });

  const host = `${req.protocol}://${req.get('host')}`;

  const result = profiles.map((p) => ({
    ...p,
    photoUrl: p.photoUrl ? `${host}${p.photoUrl}` : null,
    likeCount: p.likes.length,
  }));

  res.json(result);
};

export const likeProfile = async (req: RequestWithUserId, res: Response) => {
  const { id: profileId } = req.params;

  const existing = await prisma.like.findFirst({
    where: {
      profileId,
      likedById: req.userId!,
    },
  });

  if (existing) {
    return res.status(400).json({ error: 'Already liked' });
  }

  await prisma.like.create({
    data: {
      profileId,
      likedById: req.userId!,
    },
  });

  res.json({ success: true });
};

export const unlikeProfile = async (req: RequestWithUserId, res: Response) => {
  const { id: profileId } = req.params;

  await prisma.like.deleteMany({
    where: {
      profileId,
      likedById: req.userId!,
    },
  });

  res.json({ success: true });
};
