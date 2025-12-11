import { GameSession } from '../models/types';
import { generateSessionCode } from '../utils/helpers';

// In-memory session storage (in production, use Redis or database)
const sessions = new Map<string, GameSession>();

/**
 * Create a new game session
 */
export function createSession(playerId: string, username: string): GameSession {
  const code = generateSessionCode();
  const session: GameSession = {
    code,
    player1_id: playerId,
    player2_id: null,
    player1_username: username,
    player2_username: null,
    spectators: [],
    status: 'waiting',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  sessions.set(code, session);
  return session;
}

/**
 * Get a session by code
 */
export function getSession(code: string): GameSession | undefined {
  return sessions.get(code);
}

/**
 * Join a session as a player (only 2 players allowed, no spectators)
 */
export function joinSession(
  code: string,
  playerId: string,
  username: string
): { session: GameSession; role: 'player1' | 'player2' } {
  const session = sessions.get(code);
  if (!session) {
    throw new Error('Session not found');
  }

  // IMPORTANT: Check if already in session FIRST
  // This ensures that the creator of the session always gets player1 role
  if (session.player1_id === playerId) {
    console.log(`[SessionService] Player ${playerId} is already player1 in session ${code}`);
    return { session, role: 'player1' };
  }
  if (session.player2_id === playerId) {
    console.log(`[SessionService] Player ${playerId} is already player2 in session ${code}`);
    return { session, role: 'player2' };
  }

  // Player is not in session yet - can only join as player2 if slot is available
  if (!session.player2_id) {
    session.player2_id = playerId;
    session.player2_username = username;
    // Keep status as 'waiting' - game will start when player1 clicks "Start Game"
    session.status = 'waiting';
    session.updated_at = new Date().toISOString();
    console.log(`[SessionService] Assigned ${username} (${playerId}) as player2 in session ${code}`);
    return { session, role: 'player2' };
  }

  // Session is full (2 players already)
  throw new Error('Session is full. Maximum 2 players allowed.');
}

/**
 * Leave a session
 */
export function leaveSession(code: string, playerId: string): void {
  const session = sessions.get(code);
  if (!session) return;

  if (session.player1_id === playerId) {
    session.player1_id = null;
    session.player1_username = null;
  } else if (session.player2_id === playerId) {
    session.player2_id = null;
    session.player2_username = null;
  } else {
    session.spectators = session.spectators.filter((id) => id !== playerId);
  }

  // If no players left, remove session
  if (!session.player1_id && !session.player2_id) {
    sessions.delete(code);
  } else {
    // If one player left, reset status to waiting
    if (!session.player1_id || !session.player2_id) {
      session.status = 'waiting';
    }
    session.updated_at = new Date().toISOString();
  }
}

/**
 * Get all active sessions
 */
export function getAllSessions(): GameSession[] {
  return Array.from(sessions.values());
}

/**
 * Update session status
 */
export function updateSessionStatus(code: string, status: GameSession['status']): void {
  const session = sessions.get(code);
  if (session) {
    session.status = status;
    session.updated_at = new Date().toISOString();
  }
}

/**
 * Set game start time
 */
export function setGameStartTime(code: string, startTime: number): void {
  const session = sessions.get(code);
  if (session) {
    session.gameStartTime = startTime;
    session.updated_at = new Date().toISOString();
  }
}

/**
 * Get game start time
 */
export function getGameStartTime(code: string): number | undefined {
  const session = sessions.get(code);
  return session?.gameStartTime;
}

