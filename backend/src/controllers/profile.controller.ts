import { prisma } from '../db';
import { Response } from 'express';
import { RequestWithUserId } from '../types/express';
import { removeStoredPhoto } from '../middleware/uploadMiddleware';

const absolutePhotoUrl = (req: RequestWithUserId, photoUrl: string | null) =>
  photoUrl ? `${req.protocol}://${req.get('host')}${photoUrl}` : null;

export const parseInterests = (value: string) =>
  [...new Set(value.split(',').map((tag) => tag.trim()).filter(Boolean))];

export const getProfile = async (req: RequestWithUserId, res: Response) => {
  const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json({ ...profile, photoUrl: absolutePhotoUrl(req, profile.photoUrl) });
};

export const updateProfile = async (req: RequestWithUserId, res: Response) => {
  const userId = req.userId!;
  const { name, headline, bio, interests } = req.body;
  const fields = { name: name.trim(), headline: headline.trim(), bio: bio.trim(), interests: parseInterests(interests) };
  const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  const previous = await prisma.profile.findUnique({ where: { userId }, select: { photoUrl: true } });
  let profile;
  try {
    profile = await prisma.profile.upsert({
      where: { userId },
      update: { ...fields, ...(photoUrl && { photoUrl }) },
      create: { ...fields, photoUrl, userId },
    });
  } catch (error) {
    removeStoredPhoto(photoUrl);
    throw error;
  }
  if (photoUrl && previous?.photoUrl && previous.photoUrl !== photoUrl) removeStoredPhoto(previous.photoUrl);
  res.json({ ...profile, photoUrl: absolutePhotoUrl(req, profile.photoUrl) });
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
  const take = Number(limit);
  const userId = req.userId!;

  const profiles = await prisma.profile.findMany({
    where: { userId: { not: userId } },
    skip: (Number(page) - 1) * take,
    take,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    include: {
      _count: { select: { likes: true } },
      likes: { where: { likedById: userId }, select: { id: true } },
    },
  });

  res.json(profiles.map(({ _count, likes, ...profile }) => ({
    ...profile,
    photoUrl: absolutePhotoUrl(req, profile.photoUrl),
    likeCount: _count.likes,
    likedByCurrentUser: likes.length > 0,
  })));
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
