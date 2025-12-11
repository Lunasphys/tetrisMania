import { Router } from 'express';
import {
  getLeaderboard,
  getUserScores,
  saveScore,
} from '../controllers/leaderboardController';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getLeaderboard);
router.get('/users/:id/scores', requireAuth, getUserScores);
router.post('/', optionalAuth, saveScore);

export default router;

