import { Response, NextFunction } from 'express';
import { tokenIdentity } from '../security';
import { RequestWithUserId } from '../types/express';

export const authMiddleware = (req: RequestWithUserId, res: Response, next: NextFunction) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Token required' });

  try {
    req.userId = tokenIdentity(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
