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

  useEffect(() => {
    if (!sessionCode || !playerId || !username) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_session', { sessionCode, playerId, username });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('session_info', (info) => {
      setSessionInfo(info);
    });

    socket.on('game_state', (state) => {
      setGameState(state);
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
    };
  }, [sessionCode, playerId, username]);

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

  return {
    connected,
    gameState,
    opponentState,
    chatMessages,
    sessionInfo,
    sendMove,
    sendChatMessage,
    leaveSession,
  };
}

