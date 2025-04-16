import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RequestWithUserId } from '../types/express';

export const authMiddleware = (req: RequestWithUserId, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.userId = (decoded as any).userId;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
