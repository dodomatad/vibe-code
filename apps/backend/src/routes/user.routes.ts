import { Router } from 'express';
import { updateProfile, getProfile, getUserStats } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.put('/profile', authenticate, updateProfile);
router.get('/profile/:id', getProfile);
router.get('/stats', authenticate, getUserStats);

export default router;
