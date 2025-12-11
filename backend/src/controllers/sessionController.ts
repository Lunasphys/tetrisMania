import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createSession, getSession, getAllSessions, joinSession as joinSessionService } from '../services/sessionService';
import { generateGuestUsername } from '../utils/helpers';

/**
 * Create a new game session
 */
export async function createGameSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const username = req.body.username || (req.user ? req.user.email?.split('@')[0] : generateGuestUsername());
    const playerId = req.user?.id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const session = createSession(playerId, username);

    res.status(201).json({
      message: 'Session created successfully',
      session: {
        code: session.code,
        player1_id: session.player1_id,
        player1_username: session.player1_username,
        status: session.status,
      },
      playerId: playerId, // Return the playerId so frontend can use it
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Get session by code
 */
export async function getSessionByCode(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    const session = getSession(code);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * List all active sessions
 */
export async function listSessions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessions = getAllSessions();
    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Join a session
 */
export async function joinSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    const username = req.body.username || (req.user ? req.user.email?.split('@')[0] : generateGuestUsername());
    const playerId = req.user?.id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const { session, role } = joinSessionService(code, playerId, username);

    res.json({
      message: 'Joined session successfully',
      session,
      role,
      playerId,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to join session' });
  }
}

