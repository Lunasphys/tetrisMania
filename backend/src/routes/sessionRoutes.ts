import { Router } from 'express';
import {
  createGameSession,
  getSessionByCode,
  listSessions,
  joinSession,
} from '../controllers/sessionController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/', optionalAuth, createGameSession);
router.get('/:code', optionalAuth, getSessionByCode);
router.get('/', optionalAuth, listSessions);
router.post('/:code/join', optionalAuth, joinSession);

export default router;

