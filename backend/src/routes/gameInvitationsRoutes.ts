import { Router } from 'express';
import {
  sendGameInvitation,
  getPendingInvitations,
  acceptGameInvitation,
  rejectGameInvitation,
} from '../controllers/gameInvitationsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Game Invitations
 *   description: Send and manage game invitations to friends
 */

/**
 * @swagger
 * /api/v1/game-invitations/send:
 *   post:
 *     summary: Send a game invitation to a friend
 *     description: Invite a friend to join your game session. Only the session creator (player1) can send invitations.
 *     tags: [Game Invitations]
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
 *               - session_code
 *             properties:
 *               to_user_id:
 *                 type: string
 *                 description: Friend's user ID to invite
 *                 example: "user_xyz789"
 *               session_code:
 *                 type: string
 *                 description: 6-character game session code
 *                 example: "ABC123"
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Game invitation sent"
 *                 invitation:
 *                   $ref: '#/components/schemas/GameInvitation'
 *       400:
 *         description: Invalid request (missing fields, self-invite, or duplicate)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingUserId:
 *                 value:
 *                   error: "User ID is required"
 *                   details: "Please provide the user ID of the friend you want to invite"
 *                   code: "MISSING_USER_ID"
 *               missingSessionCode:
 *                 value:
 *                   error: "Session code is required"
 *                   details: "Please provide the session code of the game"
 *                   code: "MISSING_SESSION_CODE"
 *               selfInvite:
 *                 value:
 *                   error: "Cannot invite yourself"
 *                   details: "You cannot send a game invitation to yourself"
 *                   code: "CANNOT_INVITE_SELF"
 *               duplicate:
 *                 value:
 *                   error: "Invitation already sent"
 *                   details: "You have already sent a pending invitation to this user for this session"
 *                   code: "INVITATION_EXISTS"
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized - Only session creator can invite
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Not authorized"
 *               details: "Only the session creator can invite friends"
 *               code: "NOT_SESSION_CREATOR"
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.post('/send', requireAuth, sendGameInvitation);

/**
 * @swagger
 * /api/v1/game-invitations/pending:
 *   get:
 *     summary: Get pending game invitations (received)
 *     description: Returns all pending game invitations sent to the authenticated user
 *     tags: [Game Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Invitation ID
 *                         example: "inv_abc123"
 *                       from_user_id:
 *                         type: string
 *                         description: Sender's user ID
 *                         example: "user_xyz789"
 *                       session_code:
 *                         type: string
 *                         description: Game session code
 *                         example: "ABC123"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Invitation creation timestamp
 *                       user:
 *                         type: object
 *                         description: Sender's information
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "user_xyz789"
 *                           username:
 *                             type: string
 *                             example: "john.doe"
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get('/pending', requireAuth, getPendingInvitations);

/**
 * @swagger
 * /api/v1/game-invitations/accept:
 *   post:
 *     summary: Accept a game invitation
 *     description: Accept a pending game invitation and get the session code to join the game
 *     tags: [Game Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitation_id
 *             properties:
 *               invitation_id:
 *                 type: string
 *                 description: Invitation ID to accept
 *                 example: "inv_abc123"
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invitation accepted"
 *                 session_code:
 *                   type: string
 *                   description: Session code to join the game
 *                   example: "ABC123"
 *       400:
 *         description: Missing invitation ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invitation ID is required"
 *               details: "Please provide the invitation ID to accept"
 *               code: "MISSING_INVITATION_ID"
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Invitation not found or session expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notFound:
 *                 value:
 *                   error: "Invitation not found"
 *                   details: "No pending invitation found with this ID"
 *                   code: "INVITATION_NOT_FOUND"
 *               sessionExpired:
 *                 value:
 *                   error: "Session expired"
 *                   details: "The game session for this invitation no longer exists"
 *                   code: "SESSION_EXPIRED"
 *       500:
 *         description: Server error
 */
router.post('/accept', requireAuth, acceptGameInvitation);

/**
 * @swagger
 * /api/v1/game-invitations/reject:
 *   post:
 *     summary: Reject a game invitation
 *     description: Reject a pending game invitation that was sent to you
 *     tags: [Game Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitation_id
 *             properties:
 *               invitation_id:
 *                 type: string
 *                 description: Invitation ID to reject
 *                 example: "inv_abc123"
 *     responses:
 *       200:
 *         description: Invitation rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invitation rejected"
 *       400:
 *         description: Missing invitation ID
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.post('/reject', requireAuth, rejectGameInvitation);

export default router;