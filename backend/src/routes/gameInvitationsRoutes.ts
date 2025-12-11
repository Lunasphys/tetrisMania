import { Router } from 'express';
import {
  sendGameInvitation,
  getPendingInvitations,
  acceptGameInvitation,
  rejectGameInvitation,
} from '../controllers/gameInvitationsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/send', requireAuth, sendGameInvitation);
router.get('/pending', requireAuth, getPendingInvitations);
router.post('/accept', requireAuth, acceptGameInvitation);
router.post('/reject', requireAuth, rejectGameInvitation);

export default router;

