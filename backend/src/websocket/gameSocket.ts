import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import {
  getSession,
  leaveSession as leaveSessionService,
  updateSessionStatus,
} from '../services/sessionService';
import {
  createEmptyGrid,
  createTetromino,
  isValidPosition,
  placeTetromino,
  clearLines,
  calculateScore,
  isGameOver,
  rotateTetromino,
} from '../models/tetris';
import { PlayerState, GameMove, ChatMessage } from '../models/types';
import { supabase } from '../config/supabase';

// Store player states in memory
const playerStates = new Map<string, PlayerState>();

/**
 * Initialize WebSocket server
 */
export function initializeGameSocket(server: HTTPServer): SocketIOServer {
  // Allow connections from localhost and local network in development
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'http://localhost:5173']
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Local network IPs
        /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,  // Local network IPs (10.x.x.x)
        /^http:\/\/172\.\d+\.\d+\.\d+:5173$/, // Local network IPs (172.x.x.x - hotspot)
      ];

  const io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Store playerId in socket data for later retrieval
    socket.data = {};

    // Join a game session
    socket.on('join_session', async (data: { sessionCode: string; playerId: string; username: string }) => {
      const { sessionCode, playerId, username } = data;
      
      // Store playerId in socket data
      socket.data.playerId = playerId;
      const session = getSession(sessionCode);

      if (!session) {
        socket.emit('error', { 
          message: 'Session not found',
          details: `No session found with code: ${sessionCode}. The session may have expired or been closed.`,
          code: 'SESSION_NOT_FOUND',
          providedCode: sessionCode
        });
        console.error(`[WebSocket] Session not found: ${sessionCode} for player ${playerId}`);
        return;
      }

      socket.join(sessionCode);

      // Determine role based on session state
      // IMPORTANT: Check if player is already in session first
      let role: 'player1' | 'player2';
      if (session.player1_id === playerId) {
        role = 'player1';
        console.log(`[WebSocket] ${username} (${playerId}) rejoined as player1 in session ${sessionCode}`);
      } else if (session.player2_id === playerId) {
        role = 'player2';
        console.log(`[WebSocket] ${username} (${playerId}) rejoined as player2 in session ${sessionCode}`);
      } else {
        // Player is not in session yet - can only join as player2 if slot is available
        if (!session.player2_id) {
          session.player2_id = playerId;
          session.player2_username = username;
          session.status = 'waiting';
          session.updated_at = new Date().toISOString();
          role = 'player2';
          console.log(`[WebSocket] Assigned ${username} (${playerId}) as player2 in session ${sessionCode}`);
        } else {
          // Session is full - reject connection
          socket.emit('error', {
            message: 'Session is full',
            details: 'This session already has 2 players. Maximum 2 players allowed per session.',
            code: 'SESSION_FULL',
            sessionCode
          });
          console.log(`[WebSocket] ${username} (${playerId}) tried to join full session ${sessionCode}`);
          return;
        }
      }

      // Initialize player state (both players are always initialized)
      if (!playerStates.has(playerId)) {
        const initialState: PlayerState = {
          userId: playerId,
          username,
          grid: createEmptyGrid(),
          currentPiece: createTetromino(),
          nextPiece: createTetromino(),
          score: 0,
          linesCleared: 0,
          level: 0,
          gameOver: false,
        };
        playerStates.set(playerId, initialState);
      }

      // Only send game state if both players are connected and game is playing
      if (session.status === 'playing' && session.player1_id && session.player2_id) {
        socket.emit('game_state', playerStates.get(playerId));
      } else {
        // Send waiting state
        socket.emit('session_info', {
          session,
          role,
          waiting: true,
          message: session.player2_id ? 'Waiting for game to start...' : 'Waiting for second player...'
        });
      }

      // Notify others in the session
      socket.to(sessionCode).emit('player_joined', {
        playerId,
        username,
        role,
      });

      // Send session info
      const isWaiting = session.status !== 'playing' || !session.player1_id || !session.player2_id;
      const bothPlayersConnected = session.player1_id && session.player2_id;
      
      socket.emit('session_info', {
        session,
        role,
        waiting: isWaiting,
        bothPlayersConnected: bothPlayersConnected,
        canStart: bothPlayersConnected && role === 'player1' // Only player1 can start
      });

      // If both players are now connected, notify everyone (but don't start game yet)
      if (bothPlayersConnected && session.status === 'waiting') {
        io.to(sessionCode).emit('both_players_ready', {
          message: 'Both players connected! Waiting for game to start...',
          session,
          canStart: true
        });
      }
    });

    // Handle start game request (only player1 can start)
    socket.on('start_game', (data: { sessionCode: string; playerId: string }) => {
      const { sessionCode, playerId } = data;
      const session = getSession(sessionCode);

      if (!session) {
        socket.emit('error', {
          message: 'Session not found',
          details: `Session ${sessionCode} not found`,
          code: 'SESSION_NOT_FOUND'
        });
        return;
      }

      // Only player1 can start the game
      if (session.player1_id !== playerId) {
        socket.emit('error', {
          message: 'Only player 1 can start the game',
          details: 'Only the session creator can start the game',
          code: 'NOT_PLAYER1'
        });
        return;
      }

      // Check if both players are connected
      if (!session.player1_id || !session.player2_id) {
        socket.emit('error', {
          message: 'Cannot start game',
          details: 'Both players must be connected before starting',
          code: 'PLAYERS_NOT_READY'
        });
        return;
      }

      // Start the game
      updateSessionStatus(sessionCode, 'playing');

      // Send initial game state to both players
      const player1State = playerStates.get(session.player1_id);
      const player2State = playerStates.get(session.player2_id);

      // Send game state to each player individually
      if (player1State) {
        io.to(sessionCode).emit('game_state', player1State);
      }

      if (player2State) {
        io.to(sessionCode).emit('game_state', player2State);
      }

      // Notify everyone that game has started
      io.to(sessionCode).emit('game_started', {
        message: 'Game started!',
        session
      });

      console.log(`[WebSocket] Game started in session ${sessionCode} by player1 ${playerId}`);
    });

    // Handle game moves
    socket.on('player_move', (move: GameMove) => {
      const { type, playerId, sessionCode } = move;

      if (!type || !playerId || !sessionCode) {
        socket.emit('error', {
          message: 'Invalid move request',
          details: 'Move request must include: type, playerId, and sessionCode',
          code: 'INVALID_MOVE_REQUEST',
          provided: { type: !!type, playerId: !!playerId, sessionCode: !!sessionCode }
        });
        return;
      }

      const validMoveTypes = ['left', 'right', 'rotate', 'down', 'drop'];
      if (!validMoveTypes.includes(type)) {
        socket.emit('error', {
          message: 'Invalid move type',
          details: `Move type must be one of: ${validMoveTypes.join(', ')}. Received: ${type}`,
          code: 'INVALID_MOVE_TYPE',
          providedType: type,
          validTypes: validMoveTypes
        });
        return;
      }

      const session = getSession(sessionCode);
      
      if (!session) {
        console.error(`[WebSocket] Move failed: Session ${sessionCode} not found`);
        socket.emit('error', {
          message: 'Session not found',
          details: `Session ${sessionCode} not found`,
          code: 'SESSION_NOT_FOUND'
        });
        return;
      }

      // Check if game is in playing state and both players are connected
      if (session.status !== 'playing' || !session.player1_id || !session.player2_id) {
        socket.emit('error', {
          message: 'Game not ready',
          details: 'The game has not started yet. Both players must be connected.',
          code: 'GAME_NOT_READY',
          sessionStatus: session.status
        });
        return;
      }

      const playerState = playerStates.get(playerId);

      if (!playerState) {
        console.error(`[WebSocket] Move failed: Player ${playerId} has no game state in session ${sessionCode}`);
        socket.emit('error', {
          message: 'Game state not initialized',
          details: 'Your game state has not been initialized. Please rejoin the session.',
          code: 'GAME_STATE_NOT_INITIALIZED',
          playerId,
          sessionCode
        });
        return;
      }

      if (playerState.gameOver) {
        console.log(`[WebSocket] Move ignored: Player ${playerId} game is over`);
        return;
      }

      let newState = { ...playerState };
      let pieceMoved = false;

      switch (type) {
        case 'left':
          if (newState.currentPiece) {
            const newPos = { ...newState.currentPiece.position, x: newState.currentPiece.position.x - 1 };
            if (isValidPosition(newState.grid, newState.currentPiece, newPos)) {
              newState.currentPiece.position = newPos;
              pieceMoved = true;
            }
          }
          break;

        case 'right':
          if (newState.currentPiece) {
            const newPos = { ...newState.currentPiece.position, x: newState.currentPiece.position.x + 1 };
            if (isValidPosition(newState.grid, newState.currentPiece, newPos)) {
              newState.currentPiece.position = newPos;
              pieceMoved = true;
            }
          }
          break;

        case 'rotate':
          if (newState.currentPiece) {
            const rotated = rotateTetromino(newState.currentPiece);
            if (isValidPosition(newState.grid, rotated)) {
              newState.currentPiece = rotated;
              pieceMoved = true;
            }
          }
          break;

        case 'down':
          if (newState.currentPiece) {
            const newPos = { ...newState.currentPiece.position, y: newState.currentPiece.position.y + 1 };
            if (isValidPosition(newState.grid, newState.currentPiece, newPos)) {
              newState.currentPiece.position = newPos;
              pieceMoved = true;
            } else {
              // Lock piece
              newState.grid = placeTetromino(newState.grid, newState.currentPiece);
              const { grid, linesCleared } = clearLines(newState.grid);
              newState.grid = grid;
              newState.linesCleared += linesCleared;
              newState.score += calculateScore(linesCleared, newState.level);
              newState.level = Math.floor(newState.linesCleared / 10);
              newState.currentPiece = newState.nextPiece;
              newState.nextPiece = createTetromino();

              // Check game over
              if (isGameOver(newState.grid) || !isValidPosition(newState.grid, newState.currentPiece)) {
                newState.gameOver = true;
                updateSessionStatus(sessionCode, 'finished');

                // Save score to database
                if (newState.score > 0) {
                  supabase.from('scores').insert({
                    user_id: playerId.startsWith('guest_') ? null : playerId,
                    username: newState.username,
                    score: newState.score,
                    lines_cleared: newState.linesCleared,
                    session_code: sessionCode,
                  });
                }
              }
            }
          }
          break;

        case 'drop':
          if (newState.currentPiece) {
            let dropY = newState.currentPiece.position.y;
            while (isValidPosition(newState.grid, newState.currentPiece, {
                ...newState.currentPiece.position,
                y: dropY + 1
            })) {
              dropY++;
            }
            newState.currentPiece.position.y = dropY;
            newState.grid = placeTetromino(newState.grid, newState.currentPiece);
            const { grid, linesCleared } = clearLines(newState.grid);
            newState.grid = grid;
            newState.linesCleared += linesCleared;
            newState.score += calculateScore(linesCleared, newState.level);
            newState.level = Math.floor(newState.linesCleared / 10);
            newState.currentPiece = newState.nextPiece;
            newState.nextPiece = createTetromino();

            if (isGameOver(newState.grid) || !isValidPosition(newState.grid, newState.currentPiece)) {
              newState.gameOver = true;
              updateSessionStatus(sessionCode, 'finished');

              if (newState.score > 0) {
                supabase.from('scores').insert({
                  user_id: playerId.startsWith('guest_') ? null : playerId,
                  username: newState.username,
                  score: newState.score,
                  lines_cleared: newState.linesCleared,
                  session_code: sessionCode,
                });
              }
            }
          }
          break;
      }

      if (pieceMoved || type === 'down' || type === 'drop') {
        playerStates.set(playerId, newState);
        // Broadcast state update to all in session
        io.to(sessionCode).emit('state_update', {
          playerId,
          state: newState,
        });
      }
    });

    // Handle chat messages
    socket.on('chat_message', (data: { sessionCode: string; userId: string; username: string; message: string }) => {
      const { sessionCode, userId, username, message } = data;
      
      if (!message || message.trim().length === 0) {
        socket.emit('error', {
          message: 'Empty message',
          details: 'Chat messages cannot be empty',
          code: 'EMPTY_MESSAGE'
        });
        return;
      }

      if (message.length > 500) {
        socket.emit('error', {
          message: 'Message too long',
          details: 'Chat messages cannot exceed 500 characters',
          code: 'MESSAGE_TOO_LONG',
          maxLength: 500,
          providedLength: message.length
        });
        return;
      }

      const session = getSession(sessionCode);

      if (!session) {
        socket.emit('error', {
          message: 'Session not found',
          details: `Cannot send message: Session ${sessionCode} not found`,
          code: 'SESSION_NOT_FOUND',
          providedCode: sessionCode
        });
        return;
      }

      const chatMessage: ChatMessage = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        sessionCode,
        userId,
        username,
        message,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to all in session
      io.to(sessionCode).emit('chat_message', chatMessage);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}, reason: ${reason}`);
      // Clean up player state if needed
    });

    // Leave session
    socket.on('leave_session', (data: { sessionCode: string; playerId: string }) => {
      const { sessionCode, playerId } = data;
      
      if (!sessionCode || !playerId) {
        socket.emit('error', {
          message: 'Invalid leave request',
          details: 'Both sessionCode and playerId are required to leave a session',
          code: 'INVALID_LEAVE_REQUEST',
          provided: { sessionCode: !!sessionCode, playerId: !!playerId }
        });
        return;
      }

      const session = getSession(sessionCode);
      if (session) {
        socket.leave(sessionCode);
        leaveSessionService(sessionCode, playerId);
        playerStates.delete(playerId);
        socket.to(sessionCode).emit('player_left', { playerId });
        console.log(`[WebSocket] Player ${playerId} left session ${sessionCode}`);
      } else {
        console.warn(`[WebSocket] Attempted to leave non-existent session: ${sessionCode}`);
      }
    });
  });

  return io;
}

