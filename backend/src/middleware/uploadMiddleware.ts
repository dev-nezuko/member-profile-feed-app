import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';
import { imageExtension } from '../security';

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 4, fieldSize: 4000, parts: 6 },
}).single('photo');
export const upload = {
  single: (_field: string): RequestHandler => (req, res, next) => {
    parser(req, res, (error) => {
      if (error) return res.status(400).json({ error: 'Use one JPEG or PNG file, at most 2 MiB' });
      for (const [field, limit] of Object.entries({ name: 100, headline: 200, bio: 2000, interests: 1000 })) {
        if (typeof req.body[field] !== 'string' || req.body[field].length > limit ||
            (field === 'name' && !req.body[field].trim())) {
          return res.status(400).json({ error: 'Invalid profile fields' });
        }
      }
      if (req.file) {
        const extension = imageExtension(req.file.buffer);
        if (!extension) return res.status(400).json({ error: 'Only JPEG and PNG signatures are accepted' });
        const directory = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
        try {
          fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
          req.file.filename = randomUUID() + extension;
          fs.writeFileSync(path.join(directory, req.file.filename), req.file.buffer, { flag: 'wx', mode: 0o600 });
        } catch (failure) { return next(failure); }
      }
      return next();
    });
  },
};
