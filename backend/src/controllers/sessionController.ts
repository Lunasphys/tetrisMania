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

    // Return full session info so frontend can verify player1_id
    res.status(201).json({
      message: 'Session created successfully',
      session: {
        code: session.code,
        player1_id: session.player1_id,
        player1_username: session.player1_username,
        player2_id: session.player2_id,
        player2_username: session.player2_username,
        status: session.status,
      },
      playerId: playerId, // Return the playerId so frontend can use it
    });
  } catch (error: any) {
    console.error('[SessionController] Error creating session:', error);
    res.status(500).json({ 
      error: 'Failed to create game session',
      details: error.message || 'An unexpected error occurred while creating the session',
      code: 'SESSION_CREATE_ERROR'
    });
  }
}

/**
 * Get session by code
 */
export async function getSessionByCode(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { code } = req.params;

    if (!code || code.trim().length === 0) {
      res.status(400).json({ 
        error: 'Session code is required',
        details: 'Please provide a valid 6-character session code',
        code: 'INVALID_SESSION_CODE'
      });
      return;
    }

    const session = getSession(code.toUpperCase());

    if (!session) {
      res.status(404).json({ 
        error: 'Session not found',
        details: `No session found with code: ${code.toUpperCase()}. The session may have expired or the code is incorrect.`,
        code: 'SESSION_NOT_FOUND',
        providedCode: code.toUpperCase()
      });
      return;
    }

    res.json({ session });
  } catch (error: any) {
    console.error('[SessionController] Error getting session:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve session',
      details: error.message || 'An unexpected error occurred',
      code: 'SESSION_GET_ERROR'
    });
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

    if (!code || code.trim().length === 0) {
      res.status(400).json({ 
        error: 'Session code is required',
        details: 'Please provide a valid 6-character session code in the URL',
        code: 'INVALID_SESSION_CODE'
      });
      return;
    }

    const username = req.body.username || (req.user ? req.user.email?.split('@')[0] : generateGuestUsername());
    
    // Use provided playerId if available (from frontend localStorage), otherwise generate new one
    let playerId = req.body.playerId;
    if (!playerId) {
      playerId = req.user?.id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    try {
      const { session, role } = joinSessionService(code.toUpperCase(), playerId, username);

      res.json({
        message: 'Joined session successfully',
        session,
        role,
        playerId,
      });
    } catch (serviceError: any) {
      if (serviceError.message === 'Session not found') {
        res.status(404).json({ 
          error: 'Session not found',
          details: `No session found with code: ${code.toUpperCase()}. The session may have expired or been closed.`,
          code: 'SESSION_NOT_FOUND',
          providedCode: code.toUpperCase()
        });
        return;
      }
      if (serviceError.message === 'Session is full. Maximum 2 players allowed.') {
        res.status(400).json({ 
          error: 'Session is full',
          details: 'This session already has 2 players. Maximum 2 players allowed per session.',
          code: 'SESSION_FULL',
          providedCode: code.toUpperCase()
        });
        return;
      }
      throw serviceError;
    }
  } catch (error: any) {
    console.error('[SessionController] Error joining session:', error);
    res.status(400).json({ 
      error: 'Failed to join session',
      details: error.message || 'An unexpected error occurred while joining the session',
      code: 'SESSION_JOIN_ERROR'
    });
  }
}

