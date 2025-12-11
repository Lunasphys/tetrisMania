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
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a game session
    socket.on('join_session', async (data: { sessionCode: string; playerId: string; username: string }) => {
      const { sessionCode, playerId, username } = data;
      const session = getSession(sessionCode);

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      socket.join(sessionCode);

      // Initialize player state if joining as player
      if (session.player1_id === playerId || session.player2_id === playerId) {
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

        // Send current game state to the player
        socket.emit('game_state', playerStates.get(playerId));
      }

      // Notify others in the session
      socket.to(sessionCode).emit('player_joined', {
        playerId,
        username,
        role: session.player1_id === playerId ? 'player1' : session.player2_id === playerId ? 'player2' : 'spectator',
      });

      // Send session info
      socket.emit('session_info', {
        session,
        role: session.player1_id === playerId ? 'player1' : session.player2_id === playerId ? 'player2' : 'spectator',
      });
    });

    // Handle game moves
    socket.on('player_move', (move: GameMove) => {
      const { type, playerId, sessionCode } = move;
      const session = getSession(sessionCode);
      const playerState = playerStates.get(playerId);

      if (!session || !playerState || playerState.gameOver) {
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
            while (isValidPosition(newState.grid, newState.currentPiece, { ...newState.currentPiece.position, y: dropY + 1 })) {
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
      const session = getSession(sessionCode);

      if (!session) {
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
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Clean up player state if needed
    });

    // Leave session
    socket.on('leave_session', (data: { sessionCode: string; playerId: string }) => {
      const { sessionCode, playerId } = data;
      socket.leave(sessionCode);
      leaveSessionService(sessionCode, playerId);
      playerStates.delete(playerId);

      socket.to(sessionCode).emit('player_left', { playerId });
    });
  });

  return io;
}

