import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';

function key(): string {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('Set a private JWT_SECRET of at least 32 characters');
  return value;
}
export const issueToken = (userId: string) =>
  jwt.sign({ userId }, key(), { algorithm: 'HS256', expiresIn: '1h' });
export const tokenIdentity = (token: string): string => {
  const value = jwt.verify(token, key(), { algorithms: ['HS256'] });
  if (typeof value === 'string' || typeof value.userId !== 'string' || !value.userId) throw new Error('Invalid identity');
  return value.userId;
};
export const asyncRoute = (handler: RequestHandler): RequestHandler =>
  (req, res, next) => { Promise.resolve(handler(req, res, next)).catch(next); };

export function imageExtension(data: Buffer): string | null {
  if (data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return '.png';
  if (data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255) return '.jpg';
  return null;
}
export function validCredentials(body: unknown): body is {email: string; password: string} {
  if (!body || typeof body !== 'object') return false;
  const value = body as Record<string, unknown>;
  return typeof value.email === 'string' && value.email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) &&
    typeof value.password === 'string' && value.password.length >= 8 &&
    Buffer.byteLength(value.password, 'utf8') <= 72;
}
