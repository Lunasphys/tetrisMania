import {
  createSession,
  getSession,
  joinSession,
  leaveSession,
  getAllSessions,
} from '../services/sessionService';

describe('Session Service', () => {
  beforeEach(() => {
    // Clear sessions before each test
    const sessions = getAllSessions();
    sessions.forEach((session) => {
      leaveSession(session.code, session.player1_id || '');
      if (session.player2_id) {
        leaveSession(session.code, session.player2_id);
      }
    });
  });

  describe('createSession', () => {
    it('should create a new session with player1', () => {
      const session = createSession('player1', 'Player1');
      expect(session.player1_id).toBe('player1');
      expect(session.player1_username).toBe('Player1');
      expect(session.player2_id).toBeNull();
      expect(session.status).toBe('waiting');
      expect(session.code).toHaveLength(6);
    });
  });

  describe('joinSession', () => {
    it('should allow second player to join as player2', () => {
      const session = createSession('player1', 'Player1');
      const { role } = joinSession(session.code, 'player2', 'Player2');
      expect(role).toBe('player2');

      const updatedSession = getSession(session.code);
      expect(updatedSession?.player2_id).toBe('player2');
      expect(updatedSession?.status).toBe('waiting'); // Status remains 'waiting' until game starts
    });

    it('should throw error when session is full (2 players already exist)', () => {
      const session = createSession('player1', 'Player1');
      joinSession(session.code, 'player2', 'Player2');
      
      expect(() => {
        joinSession(session.code, 'player3', 'Player3');
      }).toThrow('Session is full');
    });

    it('should return existing role if player already in session', () => {
      const session = createSession('player1', 'Player1');
      const { role: role1 } = joinSession(session.code, 'player1', 'Player1');
      expect(role1).toBe('player1');
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        joinSession('INVALID', 'player1', 'Player1');
      }).toThrow('Session not found');
    });
  });

  describe('leaveSession', () => {
    it('should remove player2 from session', () => {
      const session = createSession('player1', 'Player1');
      joinSession(session.code, 'player2', 'Player2');
      leaveSession(session.code, 'player2');
      const updatedSession = getSession(session.code);
      expect(updatedSession?.player2_id).toBeNull();
    });

    it('should reset status to waiting when player2 leaves', () => {
      const session = createSession('player1', 'Player1');
      joinSession(session.code, 'player2', 'Player2');
      leaveSession(session.code, 'player2');
      const updatedSession = getSession(session.code);
      expect(updatedSession?.player2_id).toBeNull();
      expect(updatedSession?.status).toBe('waiting');
    });

    it('should delete session when all players leave', () => {
      const session = createSession('player1', 'Player1');
      leaveSession(session.code, 'player1');
      const updatedSession = getSession(session.code);
      expect(updatedSession).toBeUndefined();
    });
  });
});

