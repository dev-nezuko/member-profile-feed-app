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

router.get('/me', getProfile);
router.post('/', authMiddleware, upload.single('photo'), updateProfile);
router.delete('/', deleteProfile);
router.get('/feed', getFeed);
router.post('/:id/like', likeProfile);
router.delete('/:id/unlike', unlikeProfile);

export default router;
