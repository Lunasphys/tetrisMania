import { Router } from 'express';
import {
  sendFriendRequest,
  sendFriendRequestByUsername,
  acceptFriendRequest,
  refuseFriendRequest,
  getFriends,
  getPendingRequests,
  searchUser,
  removeFriend,
} from '../controllers/friendsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/request', requireAuth, sendFriendRequest);
router.post('/request-by-username', requireAuth, sendFriendRequestByUsername);
router.post('/accept', requireAuth, acceptFriendRequest);
router.post('/refuse', requireAuth, refuseFriendRequest);
router.get('/', requireAuth, getFriends);
router.get('/pending', requireAuth, getPendingRequests);
router.get('/search', requireAuth, searchUser);
router.post('/remove', requireAuth, removeFriend);

export default router;

