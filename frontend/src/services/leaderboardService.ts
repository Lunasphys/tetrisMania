import api from '../config/api';

export interface Score {
  id: string;
  user_id: string | null;
  username: string;
  score: number;
  lines_cleared: number;
  session_code: string | null;
  created_at: string;
}

export const leaderboardService = {
  getLeaderboard: async (limit: number = 100): Promise<Score[]> => {
    const { data } = await api.get('/leaderboard', { params: { limit } });
    return data.leaderboard;
  },

  getUserScores: async (userId: string): Promise<Score[]> => {
    const { data } = await api.get(`/leaderboard/users/${userId}/scores`);
    return data.scores;
  },

  saveScore: async (score: number, linesCleared: number, sessionCode: string, username: string): Promise<void> => {
    await api.post('/leaderboard', {
      score,
      lines_cleared: linesCleared,
      session_code: sessionCode,
      username,
    });
  },
};

