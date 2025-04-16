import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.route';
import profileRoutes from './routes/profile.route';
import path from 'path';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.listen(3001, () => console.log('API running on http://localhost:3001'));
