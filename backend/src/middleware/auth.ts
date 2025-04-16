import { Response, NextFunction } from 'express';
import { tokenIdentity } from '../security';
import { RequestWithUserId } from '../types/express';

export const authMiddleware = (req: RequestWithUserId, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    req.userId = tokenIdentity(token);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
