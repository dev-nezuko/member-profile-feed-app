import bcrypt from 'bcrypt';
import { issueToken, validCredentials } from '../security';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RequestWithUserId } from '../types/express';

const prisma = new PrismaClient();

export const signup = async (req: RequestWithUserId, res: Response) => {
  if (!validCredentials(req.body)) return res.status(400).json({ error: 'Use a valid email and an 8–72 byte password' });
  const { email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'User exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed } });

  const token = issueToken(user.id);
  res.json({ token, userId: user.id });
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
