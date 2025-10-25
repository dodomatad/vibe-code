import { Router } from 'express';
import {
  createGameSession,
  getGameSession,
  getGameResults,
} from '../controllers/game.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/session', authenticate, createGameSession);
router.get('/session/:pin', getGameSession);
router.get('/results/:sessionId', authenticate, getGameResults);

export default router;
