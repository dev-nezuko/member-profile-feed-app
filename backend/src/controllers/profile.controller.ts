import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { Response } from 'express';
import { RequestWithUserId } from '../types/express';
import { removeStoredPhoto } from '../middleware/uploadMiddleware';

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

  const data: Prisma.ProfileUncheckedCreateInput = {
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
  const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  await prisma.profile.delete({ where: { id: profile.id } });
  removeStoredPhoto(profile.photoUrl);
  res.json({ message: 'Deleted' });
};

export const getFeed = async (req: RequestWithUserId, res: Response) => {
  const { page = '1', limit = '5' } = req.query;
  if (typeof page !== 'string' || !/^[1-9]\d{0,4}$/.test(page) ||
      typeof limit !== 'string' || !/^[1-9]\d?$/.test(limit) || Number(limit) > 50) {
    return res.status(400).json({ error: 'Use page 1–99999 and limit 1–50' });
  }
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

const likeSummary = async (profileId: string, userId: string) => ({
  likeCount: await prisma.like.count({ where: { profileId } }),
  likedByCurrentUser: (await prisma.like.count({ where: { profileId, likedById: userId } })) > 0,
});

export const likeProfile = async (req: RequestWithUserId, res: Response) => {
  const userId = req.userId!;
  const profile = await prisma.profile.findUnique({ where: { id: req.params.id }, select: { id: true, userId: true } });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  if (profile.userId === userId) return res.status(400).json({ error: 'You cannot like your own profile' });

  // ON CONFLICT DO NOTHING: a repeated or concurrent like is a no-op, not a duplicate row.
  await prisma.like.createMany({ data: [{ profileId: profile.id, likedById: userId }], skipDuplicates: true });
  res.json(await likeSummary(profile.id, userId));
};

export const unlikeProfile = async (req: RequestWithUserId, res: Response) => {
  const userId = req.userId!;
  const profile = await prisma.profile.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  await prisma.like.deleteMany({ where: { profileId: profile.id, likedById: userId } });
  res.json(await likeSummary(profile.id, userId));
};
