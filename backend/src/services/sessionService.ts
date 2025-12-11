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
 * Join a session as a player (if slot available) or spectator
 */
export function joinSession(
  code: string,
  playerId: string,
  username: string
): { session: GameSession; role: 'player1' | 'player2' | 'spectator' } {
  const session = sessions.get(code);
  if (!session) {
    throw new Error('Session not found');
  }

  // Check if already in session
  if (session.player1_id === playerId) {
    return { session, role: 'player1' };
  }
  if (session.player2_id === playerId) {
    return { session, role: 'player2' };
  }
  if (session.spectators.includes(playerId)) {
    return { session, role: 'spectator' };
  }

  // Try to join as player2
  if (!session.player2_id) {
    session.player2_id = playerId;
    session.player2_username = username;
    session.status = 'playing';
    session.updated_at = new Date().toISOString();
    return { session, role: 'player2' };
  }

  // Join as spectator
  session.spectators.push(playerId);
  session.updated_at = new Date().toISOString();
  return { session, role: 'spectator' };
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
  if (!session.player1_id && !session.player2_id && session.spectators.length === 0) {
    sessions.delete(code);
  } else {
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

