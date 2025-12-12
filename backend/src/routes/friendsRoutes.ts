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

/**
 * @swagger
 * tags:
 *   name: Friends
 *   description: Friend system management - send/accept requests, search users
 */

/**
 * @swagger
 * /api/v1/friends:
 *   get:
 *     summary: Get user's friends list
 *     description: Returns a list of all accepted friends for the authenticated user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Friends list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Friend's user ID
 *                         example: "user_xyz789"
 *                       username:
 *                         type: string
 *                         description: Friend's username
 *                         example: "john.doe"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.get('/', requireAuth, getFriends);

/**
 * @swagger
 * /api/v1/friends/pending:
 *   get:
 *     summary: Get pending friend requests (received)
 *     description: Returns all pending friend requests sent to the authenticated user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Request ID
 *                       from_user_id:
 *                         type: string
 *                         description: Sender's user ID
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           username:
 *                             type: string
 *       401:
 *         description: Authentication required
 */
router.get('/pending', requireAuth, getPendingRequests);

/**
 * @swagger
 * /api/v1/friends/search:
 *   get:
 *     summary: Search users by username
 *     description: Search for users by their username (partial, case-insensitive match). Returns up to 10 results.
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: Username to search (partial match supported)
 *         example: "john"
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Email to search (exact match)
 *         example: "john@example.com"
 *     responses:
 *       200:
 *         description: Search results (excludes current user)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "user_abc123"
 *                       username:
 *                         type: string
 *                         example: "john.doe"
 *       400:
 *         description: Missing search parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Search parameter required"
 *               details: "Please provide either username or email to search"
 *               code: "MISSING_SEARCH_PARAM"
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get('/search', requireAuth, searchUser);

/**
 * @swagger
 * /api/v1/friends/request:
 *   post:
 *     summary: Send a friend request by user ID
 *     description: Send a friend request to another user using their user ID
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to_user_id
 *             properties:
 *               to_user_id:
 *                 type: string
 *                 description: Target user's ID
 *                 example: "user_xyz789"
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend request sent"
 *                 request:
 *                   $ref: '#/components/schemas/FriendRequest'
 *       400:
 *         description: Invalid request (missing user ID, self-request, or duplicate)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingUserId:
 *                 value:
 *                   error: "User ID is required"
 *                   code: "MISSING_USER_ID"
 *               selfRequest:
 *                 value:
 *                   error: "Cannot add yourself as a friend"
 *                   code: "CANNOT_ADD_SELF"
 *               duplicate:
 *                 value:
 *                   error: "Friend request already exists"
 *                   code: "FRIEND_REQUEST_EXISTS"
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.post('/request', requireAuth, sendFriendRequest);

/**
 * @swagger
 * /api/v1/friends/request-by-username:
 *   post:
 *     summary: Send a friend request by username
 *     description: Send a friend request to another user using their username (case-insensitive, supports partial match)
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Target user's username
 *                 example: "john.doe"
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend request sent"
 *                 request:
 *                   $ref: '#/components/schemas/FriendRequest'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "User not found"
 *               details: "No user found with username: john.doe"
 *               code: "USER_NOT_FOUND"
 *       500:
 *         description: Server error
 */
router.post('/request-by-username', requireAuth, sendFriendRequestByUsername);

/**
 * @swagger
 * /api/v1/friends/accept:
 *   post:
 *     summary: Accept a friend request
 *     description: Accept a pending friend request that was sent to you
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *             properties:
 *               request_id:
 *                 type: string
 *                 description: Friend request ID to accept
 *                 example: "req_abc123"
 *     responses:
 *       200:
 *         description: Friend request accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend request accepted"
 *       400:
 *         description: Missing request ID
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Friend request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Friend request not found"
 *               details: "No pending friend request found with this ID"
 *               code: "FRIEND_REQUEST_NOT_FOUND"
 *       500:
 *         description: Server error
 */
router.post('/accept', requireAuth, acceptFriendRequest);

/**
 * @swagger
 * /api/v1/friends/refuse:
 *   post:
 *     summary: Refuse/Reject a friend request
 *     description: Reject a pending friend request that was sent to you
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *             properties:
 *               request_id:
 *                 type: string
 *                 description: Friend request ID to refuse
 *                 example: "req_abc123"
 *     responses:
 *       200:
 *         description: Friend request refused
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend request refused"
 *       400:
 *         description: Missing request ID
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.post('/refuse', requireAuth, refuseFriendRequest);

/**
 * @swagger
 * /api/v1/friends/remove:
 *   delete:
 *     summary: Remove/Delete a friend
 *     description: Remove an existing friend from your friends list
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friend_id
 *             properties:
 *               friend_id:
 *                 type: string
 *                 description: Friend's user ID to remove
 *                 example: "user_xyz789"
 *     responses:
 *       200:
 *         description: Friend removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend removed successfully"
 *       400:
 *         description: Missing friend ID
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.delete('/remove', requireAuth, removeFriend);

export default router;