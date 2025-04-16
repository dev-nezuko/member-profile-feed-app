import { asyncRoute } from '../security';
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getProfile,
  updateProfile,
  deleteProfile,
  getFeed,
  likeProfile,
  unlikeProfile,
} from '../controllers/profile.controller';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();
router.use(authMiddleware);

router.get('/me', asyncRoute(getProfile));
router.post('/', authMiddleware, upload.single('photo'), asyncRoute(updateProfile));
router.delete('/', asyncRoute(deleteProfile));
router.get('/feed', asyncRoute(getFeed));
router.post('/:id/like', asyncRoute(likeProfile));
router.delete('/:id/unlike', asyncRoute(unlikeProfile));

export default router;
