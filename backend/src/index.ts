import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.route';
import profileRoutes from './routes/profile.route';
import { uploadDirectory } from './middleware/uploadMiddleware';

export const app = express();

// Photos are fetched by the frontend's origin, so allow cross-origin embedding of responses.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_req, res) => { res.json({ status: 'ok' }); });
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not found' }); });
app.use('/uploads', express.static(uploadDirectory(), { dotfiles: 'deny', setHeaders: (res) => { res.setHeader('X-Content-Type-Options', 'nosniff'); } }));

const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  // body-parser marks client mistakes (malformed or oversized JSON) with a 4xx status.
  const status = Number(error?.status);
  if (status >= 400 && status < 500) return res.status(status).json({ error: 'The request body could not be read' });
  console.error(error);
  res.status(500).json({ error: 'Request could not be completed' });
};
app.use(errors);
if (require.main === module) app.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1',
  () => console.log('Local member API started'));
