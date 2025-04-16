import { asyncRoute } from '../security';
import express from 'express';
import { signup, login } from '../controllers/auth.controller';
const router = express.Router();
router.post('/signup', asyncRoute(signup));
router.post('/login', asyncRoute(login));
export default router;
