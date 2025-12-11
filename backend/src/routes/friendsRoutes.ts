import { Router } from 'express';
import {
  sendFriendRequest,
  acceptFriendRequest,
  refuseFriendRequest,
  getFriends,
} from '../controllers/friendsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/request', requireAuth, sendFriendRequest);
router.post('/accept', requireAuth, acceptFriendRequest);
router.post('/refuse', requireAuth, refuseFriendRequest);
router.get('/', requireAuth, getFriends);

export default router;

