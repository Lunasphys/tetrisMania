// User types
export interface User {
  id: string;
  email: string;
  username?: string;
  created_at: string;
  is_guest?: boolean;
}

// Session types
export interface GameSession {
  code: string;
  player1_id: string | null;
  player2_id: string | null;
  player1_username: string | null;
  player2_username: string | null;
  spectators: string[];
  status: 'waiting' | 'playing' | 'finished';
  created_at: string;
  updated_at: string;
  gameStartTime?: number; // Timestamp when game started (for 2-minute timer)
}

export interface PlayerState {
  userId: string;
  username: string;
  grid: number[][];
  currentPiece: Tetromino | null;
  nextPiece: Tetromino | null;
  score: number;
  linesCleared: number;
  level: number;
  gameOver: boolean;
}

// Tetris types
export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  shape: number[][];
  position: Position;
  type: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
  rotation: number;
}

export interface GameMove {
  type: 'left' | 'right' | 'rotate' | 'down' | 'drop';
  playerId: string;
  sessionCode: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  sessionCode: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
}

// Friend types
export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

// Score types
export interface Score {
  id: string;
  user_id: string | null;
  username: string;
  score: number;
  lines_cleared: number;
  session_code: string;
  created_at: string;
}

