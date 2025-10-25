import { Router } from 'express';
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quiz.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@quizflow/shared';

const router = Router();

router.post('/', authenticate, authorize(UserRole.TEACHER, UserRole.ADMIN), createQuiz);
router.get('/', authenticate, getQuizzes);
router.get('/:id', authenticate, getQuizById);
router.put('/:id', authenticate, authorize(UserRole.TEACHER, UserRole.ADMIN), updateQuiz);
router.delete('/:id', authenticate, authorize(UserRole.TEACHER, UserRole.ADMIN), deleteQuiz);

export default router;
