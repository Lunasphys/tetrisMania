import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Auto-detect socket URL based on current hostname
const getSocketUrl = () => {
  // If VITE_SOCKET_URL is explicitly set, use it
  if (import.meta.env.VITE_SOCKET_URL && import.meta.env.VITE_SOCKET_URL !== 'http://localhost:3001') {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // If accessing via IP (not localhost), use the same IP for socket
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  
  // Default to localhost
  return 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

export interface GameState {
  userId: string;
  username: string;
  grid: number[][];
  currentPiece: any;
  nextPiece: any;
  score: number;
  linesCleared: number;
  level: number;
  gameOver: boolean;
}

export function useWebSocket(sessionCode: string | null, playerId: string | null, username: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [opponentState, setOpponentState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [gameResult, setGameResult] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [gameDuration, setGameDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionCode || !playerId || !username) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[WebSocket] Connected, joining session:', sessionCode, 'with playerId:', playerId);
      socket.emit('join_session', { sessionCode, playerId, username });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('session_info', (info) => {
      setSessionInfo(info);
    });

    socket.on('both_players_ready', (data) => {
      console.log('Both players ready:', data);
      setSessionInfo((prev: any) => ({ 
        ...prev, 
        waiting: true,
        bothPlayersConnected: true,
        canStart: data.canStart
      }));
    });

    socket.on('game_started', (data) => {
      console.log('Game started:', data);
      setSessionInfo((prev: any) => ({ ...prev, waiting: false }));
      setGameResult(null); // Reset game result when new game starts
      
      // Store game start time and duration for timer
      if (data.startTime) {
        setGameStartTime(data.startTime);
        setGameDuration(data.duration || 2 * 60 * 1000); // Default 2 minutes
      }
    });

    socket.on('game_finished', (data) => {
      console.log('Game finished:', data);
      setGameResult(data);
      setSessionInfo((prev: any) => ({ ...prev, waiting: false }));
      setGameStartTime(null);
      setGameDuration(null);
      setTimeRemaining(null);
    });

    socket.on('game_state', (state: GameState) => {
      // Check if this state belongs to us or opponent
      if (state.userId === playerId) {
        setGameState(state);
      } else {
        setOpponentState(state);
      }
    });

    socket.on('state_update', (data: { playerId: string; state: GameState }) => {
      if (data.playerId === playerId) {
        setGameState(data.state);
      } else {
        setOpponentState(data.state);
      }
    });

    socket.on('chat_message', (message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socket.on('player_joined', (data) => {
      console.log('Player joined:', data);
    });

    socket.on('player_left', (data) => {
      console.log('Player left:', data);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.disconnect();
      setGameStartTime(null);
      setGameDuration(null);
      setTimeRemaining(null);
    };
  }, [sessionCode, playerId, username]);

  // Timer effect to update remaining time
  useEffect(() => {
    if (!gameStartTime || !gameDuration) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - gameStartTime;
      const remaining = Math.max(0, gameDuration - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setTimeRemaining(0);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [gameStartTime, gameDuration]);

  const sendMove = (type: 'left' | 'right' | 'rotate' | 'down' | 'drop') => {
    if (socketRef.current && sessionCode && playerId) {
      socketRef.current.emit('player_move', { type, playerId, sessionCode });
    }
  };

  const sendChatMessage = (message: string) => {
    if (socketRef.current && sessionCode && playerId && username) {
      socketRef.current.emit('chat_message', {
        sessionCode,
        userId: playerId,
        username,
        message,
      });
    }
  };

  const leaveSession = () => {
    if (socketRef.current && sessionCode && playerId) {
      socketRef.current.emit('leave_session', { sessionCode, playerId });
      socketRef.current.disconnect();
    }
  };

  const startGame = () => {
    if (socketRef.current && sessionCode && playerId) {
      socketRef.current.emit('start_game', { sessionCode, playerId });
    }
  };

  return {
    connected,
    gameState,
    opponentState,
    chatMessages,
    sessionInfo,
    gameResult,
    timeRemaining,
    sendMove,
    sendChatMessage,
    leaveSession,
    startGame,
  };
}

