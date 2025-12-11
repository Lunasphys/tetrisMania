import api from '../config/api';

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
}

export const gameService = {
  createSession: async (username?: string): Promise<GameSession> => {
    const { data } = await api.post('/sessions', { username });
    return data.session;
  },

  getSession: async (code: string): Promise<GameSession> => {
    const { data } = await api.get(`/sessions/${code}`);
    return data.session;
  },

  joinSession: async (code: string, username?: string): Promise<any> => {
    const { data } = await api.post(`/sessions/${code}/join`, { username });
    return data;
  },
};

