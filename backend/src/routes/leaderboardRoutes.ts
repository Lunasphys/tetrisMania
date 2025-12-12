import { Router } from 'express';
import {
  getLeaderboard,
  getUserScores,
  saveScore,
} from '../controllers/leaderboardController';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Leaderboard
 *   description: Score tracking and leaderboard management
 */

/**
 * @swagger
 * /api/v1/leaderboard:
 *   get:
 *     summary: Get global leaderboard
 *     description: Returns the top scores from all players, sorted by score (highest first)
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 100
 *         description: Maximum number of scores to return
 *         example: 50
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Score'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', optionalAuth, getLeaderboard);

/**
 * @swagger
 * /api/v1/leaderboard/users/{id}/scores:
 *   get:
 *     summary: Get user's score history
 *     description: Returns the last 50 scores for a specific user. You can only view your own scores or your friends' scores.
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "user_abc123"
 *     responses:
 *       200:
 *         description: User scores retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scores:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Score'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Authentication required"
 *               details: "You must be logged in to view score history"
 *               code: "AUTHENTICATION_REQUIRED"
 *       403:
 *         description: Access denied - Can only view own scores or friends' scores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied"
 *               details: "You can only view your own scores or your friends' scores"
 *               code: "ACCESS_DENIED"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/:id/scores', requireAuth, getUserScores);

/**
 * @swagger
 * /api/v1/leaderboard:
 *   post:
 *     summary: Save a game score
 *     description: Records a player's score after completing a game. Works for both authenticated users and guests.
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: integer
 *                 minimum: 0
 *                 description: Total score achieved in the game
 *                 example: 5000
 *               lines_cleared:
 *                 type: integer
 *                 minimum: 0
 *                 description: Number of lines cleared during the game
 *                 example: 25
 *               session_code:
 *                 type: string
 *                 description: Associated session code (optional)
 *                 example: "ABC123"
 *               username:
 *                 type: string
 *                 description: Display name (optional, auto-generated if not provided)
 *                 example: "ProGamer42"
 *     responses:
 *       201:
 *         description: Score saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Score saved"
 *                 score:
 *                   $ref: '#/components/schemas/Score'
 *       400:
 *         description: Invalid score data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingScore:
 *                 value:
 *                   error: "Score is required"
 *                   details: "Please provide a valid score value (number >= 0)"
 *                   code: "MISSING_SCORE"
 *               invalidScore:
 *                 value:
 *                   error: "Invalid score value"
 *                   details: "Score must be a non-negative integer"
 *                   code: "INVALID_SCORE"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', optionalAuth, saveScore);

export default router;