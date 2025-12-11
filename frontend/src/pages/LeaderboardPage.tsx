import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderboardService, Score } from '../services/leaderboardService';
import './LeaderboardPage.css';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await leaderboardService.getLeaderboard(100);
        setScores(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-container">Loading...</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <h1>🏆 Leaderboard</h1>
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Home
        </button>

        {scores.length === 0 ? (
          <div className="no-scores">No scores yet. Be the first to play!</div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Score</th>
                <th>Lines</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr key={score.id}>
                  <td>{index + 1}</td>
                  <td>{score.username}</td>
                  <td>{score.score.toLocaleString()}</td>
                  <td>{score.lines_cleared}</td>
                  <td>{new Date(score.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

