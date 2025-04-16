import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.route';
import profileRoutes from './routes/profile.route';
import path from 'path';

dotenv.config();
export const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '16kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')), { dotfiles: 'deny', setHeaders: (res) => { res.setHeader('X-Content-Type-Options', 'nosniff'); } }));

const errors: ErrorRequestHandler = (_error, _req, res, _next) => {
  res.status(500).json({ error: 'Request could not be completed' });
};
app.use(errors);
if (require.main === module) app.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1',
  () => console.log('Local member API started'));
