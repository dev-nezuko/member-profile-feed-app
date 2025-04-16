import bcrypt from 'bcrypt';
import { issueToken, validCredentials } from '../security';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { RequestWithUserId } from '../types/express';

export const signup = async (req: RequestWithUserId, res: Response) => {
  if (!validCredentials(req.body)) return res.status(400).json({ error: 'Use a valid email and an 8–72 byte password' });
  const { email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const hashed = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await prisma.user.create({ data: { email, password: hashed } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    throw error;
  }

  res.json({ token: issueToken(user.id), userId: user.id });
};

export const login = async (req: RequestWithUserId, res: Response) => {
  if (!validCredentials(req.body)) return res.status(400).json({ error: 'Use a valid email and an 8–72 byte password' });
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = issueToken(user.id);
  res.json({ token, userId: user.id });
};
