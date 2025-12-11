import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { friendsService, Friend } from '../services/friendsService';
import { leaderboardService, Score } from '../services/leaderboardService';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [friendsData, scoresData] = await Promise.all([
          friendsService.getFriends(),
          leaderboardService.getUserScores(user.id),
        ]);
        setFriends(friendsData);
        setScores(scoresData.slice(0, 10)); // Show last 10 scores
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="profile-page">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Profile</h1>
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Home
        </button>

        <div className="profile-section">
          <h2>Account Info</h2>
          <div className="profile-info">
            <div>
              <strong>Email:</strong> {user?.email}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id}
            </div>
          </div>
          <button onClick={handleSignOut} className="signout-button">
            Sign Out
          </button>
        </div>

        <div className="profile-section">
          <h2>Friends ({friends.length})</h2>
          {friends.length === 0 ? (
            <div className="empty-state">No friends yet</div>
          ) : (
            <div className="friends-list">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-item">
                  {friend.username || friend.email}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Recent Scores</h2>
          {scores.length === 0 ? (
            <div className="empty-state">No scores yet</div>
          ) : (
            <div className="scores-list">
              {scores.map((score) => (
                <div key={score.id} className="score-item">
                  <div>
                    <strong>{score.score.toLocaleString()}</strong> points
                  </div>
                  <div>{score.lines_cleared} lines</div>
                  <div className="score-date">{new Date(score.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

