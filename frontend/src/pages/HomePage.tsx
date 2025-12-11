import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';

export default function HomePage() {
    const navigate = useNavigate();
    const { user, isGuest, guestUsername, setGuest } = useAuth();
    const [sessionCode, setSessionCode] = useState('');
    const [username, setUsername] = useState(guestUsername || '');

    const handleCreateSession = async () => {
        try {
            // Just navigate to /game without sessionCode
            // GamePage will handle the session creation
            navigate('/game');
        } catch (error) {
            console.error('Failed to navigate to game:', error);
            alert('Failed to start game');
        }
    };

    const handleJoinSession = () => {
        if (!sessionCode.trim()) {
            alert('Please enter a session code');
            return;
        }

        // Just navigate - GamePage will handle the join logic
        navigate(`/game/${sessionCode.toUpperCase()}`);
    };

    const handlePlayAsGuest = () => {
        const guestName = prompt('Enter your username:') || `Guest_${Math.random().toString(36).substring(2, 8)}`;
        setGuest(true, guestName);
        setUsername(guestName);
    };

    return (
        <div className="home-page">
            <div className="home-container">
                <h1 className="home-title">🎮 Tetris Mania</h1>
                <p className="home-subtitle">1v1 Online Tetris Battle</p>

                {!user && !isGuest && (
                    <div className="auth-buttons">
                        <button onClick={() => navigate('/login')} className="btn btn-primary">
                            Login
                        </button>
                        <button onClick={() => navigate('/signup')} className="btn btn-secondary">
                            Sign Up
                        </button>
                        <button onClick={handlePlayAsGuest} className="btn btn-guest">
                            Play as Guest
                        </button>
                    </div>
                )}

                {(user || isGuest) && (
                    <div className="game-actions">
                        <div className="username-section">
                            <label>Username:</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={user?.email?.split('@')[0] || 'Enter username'}
                                className="username-input"
                            />
                        </div>

                        <button onClick={handleCreateSession} className="btn btn-primary btn-large">
                            Create New Game
                        </button>

                        <div className="join-section">
                            <input
                                type="text"
                                value={sessionCode}
                                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                                placeholder="Enter session code"
                                maxLength={6}
                                className="session-input"
                            />
                            <button onClick={handleJoinSession} className="btn btn-secondary">
                                Join Game
                            </button>
                        </div>
                    </div>
                )}

                <div className="home-links">
                    <button onClick={() => navigate('/leaderboard')} className="btn btn-link">
                        View Leaderboard
                    </button>
                    {user && (
                        <button onClick={() => navigate('/profile')} className="btn btn-link">
                            Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}