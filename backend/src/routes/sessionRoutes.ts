import { Router } from 'express';
import {
  createGameSession,
  getSessionByCode,
  listSessions,
  joinSession,
} from '../controllers/sessionController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Game session management
 */

/**
 * @swagger
 * /api/v1/sessions:
 *   post:
 *     summary: Create a new game session
 *     description: Creates a new Tetris game session and returns the session code. The creator becomes player1.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Display name for the player (optional, auto-generated if not provided)
 *                 example: "Player1"
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session created successfully"
 *                 session:
 *                   $ref: '#/components/schemas/Session'
 *                 playerId:
 *                   type: string
 *                   description: Player ID for this session
 *                   example: "user_abc123"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', optionalAuth, createGameSession);

/**
 * @swagger
 * /api/v1/sessions/{code}:
 *   get:
 *     summary: Get session details by code
 *     description: Retrieves information about a specific game session using its 6-character code
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *         description: 6-character session code (case-insensitive)
 *         example: "ABC123"
 *     responses:
 *       200:
 *         description: Session found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   $ref: '#/components/schemas/Session'
 *       400:
 *         description: Invalid session code format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Session not found"
 *               details: "No session found with code: ABC123"
 *               code: "SESSION_NOT_FOUND"
 */
router.get('/:code', optionalAuth, getSessionByCode);

/**
 * @swagger
 * /api/v1/sessions:
 *   get:
 *     summary: List all active sessions
 *     description: Returns a list of all currently active game sessions
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: List of active sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 *       500:
 *         description: Server error
 */
router.get('/', optionalAuth, listSessions);

/**
 * @swagger
 * /api/v1/sessions/{code}/join:
 *   post:
 *     summary: Join an existing game session
 *     description: Allows a player to join an existing game session as player2. Maximum 2 players per session.
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *         description: 6-character session code (case-insensitive)
 *         example: "ABC123"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Display name for the player
 *                 example: "Player2"
 *               playerId:
 *                 type: string
 *                 description: Optional player ID (auto-generated if not provided)
 *                 example: "user_xyz789"
 *     responses:
 *       200:
 *         description: Successfully joined session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Joined session successfully"
 *                 session:
 *                   $ref: '#/components/schemas/Session'
 *                 role:
 *                   type: string
 *                   enum: [player1, player2]
 *                   description: Player role in the session
 *                 playerId:
 *                   type: string
 *                   description: Player ID for this session
 *       400:
 *         description: Session is full or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Session is full"
 *               details: "This session already has 2 players"
 *               code: "SESSION_FULL"
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:code/join', optionalAuth, joinSession);

export default router;