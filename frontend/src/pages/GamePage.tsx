import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { gameService } from '../services/gameService';
import TetrisGrid from '../components/TetrisGrid';
import Chat from '../components/Chat';
import './GamePage.css';

export default function GamePage() {
  const { sessionCode: urlSessionCode } = useParams();
  const navigate = useNavigate();
  const { user, isGuest, guestUsername } = useAuth();
  const [sessionCode, setSessionCode] = useState(urlSessionCode || '');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'player1' | 'player2' | 'spectator' | null>(null);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        let code = urlSessionCode;
        let displayName = username || guestUsername || (user?.email?.split('@')[0]) || 'Player';
        // Generate a consistent playerId that will be used for both REST and WebSocket
        const pid = user?.id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        if (!code) {
          // Create new session
          const result = await gameService.createSession(displayName);
          code = result.session.code;
          setSessionCode(code);
          // Use the playerId returned from server to ensure consistency
          const serverPlayerId = result.playerId || pid;
          setPlayerId(serverPlayerId);
          // When creating, we are always player1
          setRole('player1');
        } else {
          // Join existing session
          const result = await gameService.joinSession(code, displayName);
          setRole(result.role);
          setPlayerId(result.playerId || pid);
        }

        setUsername(displayName);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('Failed to initialize game');
        navigate('/');
      }
    };

    initializeGame();
  }, []);

  const { connected, gameState, opponentState, chatMessages, sessionInfo, sendMove, sendChatMessage, leaveSession } =
    useWebSocket(sessionCode, playerId, username);

  // Update role from session info when received from server
  useEffect(() => {
    if (sessionInfo?.role) {
      setRole(sessionInfo.role);
    }
  }, [sessionInfo]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!connected || role === 'spectator') return;

      switch (e.key) {
        case 'ArrowLeft':
          sendMove('left');
          break;
        case 'ArrowRight':
          sendMove('right');
          break;
        case 'ArrowUp':
          sendMove('rotate');
          break;
        case 'ArrowDown':
          sendMove('down');
          break;
        case ' ':
          e.preventDefault();
          sendMove('drop');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [connected, role, sendMove]);

  useEffect(() => {
    // Auto-drop piece
    if (!connected || role === 'spectator' || !gameState || gameState.gameOver) return;

    const interval = setInterval(() => {
      sendMove('down');
    }, 1000);

    return () => clearInterval(interval);
  }, [connected, role, gameState, sendMove]);

  const handleLeave = () => {
    leaveSession();
    navigate('/');
  };

  if (!connected || !playerId) {
    return (
      <div className="game-page loading">
        <div>Connecting...</div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <div className="session-info">
          <h2>Session: {sessionCode}</h2>
          <div className="role-badge">{role}</div>
          <div className="connection-status">{connected ? '🟢 Connected' : '🔴 Disconnected'}</div>
        </div>
        <button onClick={handleLeave} className="leave-button">
          Leave Game
        </button>
      </div>

      <div className="game-content">
        <div className="game-boards">
          {role === 'player1' && (
            <>
              <TetrisGrid
                grid={gameState?.grid || []}
                currentPiece={gameState?.currentPiece}
                title="You"
                score={gameState?.score}
                lines={gameState?.linesCleared}
                level={gameState?.level}
              />
              <TetrisGrid
                grid={opponentState?.grid || []}
                title={sessionInfo?.session?.player2_username || 'Opponent'}
                score={opponentState?.score}
                lines={opponentState?.linesCleared}
                level={opponentState?.level}
              />
            </>
          )}

          {role === 'player2' && (
            <>
              <TetrisGrid
                grid={gameState?.grid || []}
                currentPiece={gameState?.currentPiece}
                title="You"
                score={gameState?.score}
                lines={gameState?.linesCleared}
                level={gameState?.level}
              />
              <TetrisGrid
                grid={opponentState?.grid || []}
                title={sessionInfo?.session?.player1_username || 'Opponent'}
                score={opponentState?.score}
                lines={opponentState?.linesCleared}
                level={opponentState?.level}
              />
            </>
          )}

          {role === 'spectator' && (
            <>
              <TetrisGrid
                grid={opponentState?.grid || []}
                title={sessionInfo?.session?.player1_username || 'Player 1'}
                score={opponentState?.score}
                lines={opponentState?.linesCleared}
                level={opponentState?.level}
              />
              <TetrisGrid
                grid={gameState?.grid || []}
                title={sessionInfo?.session?.player2_username || 'Player 2'}
                score={gameState?.score}
                lines={gameState?.linesCleared}
                level={gameState?.level}
              />
            </>
          )}
        </div>

        <div className="game-sidebar">
          <div className="controls-info">
            <h3>Controls</h3>
            <div className="controls-list">
              <div>← → Move</div>
              <div>↑ Rotate</div>
              <div>↓ Soft Drop</div>
              <div>Space Hard Drop</div>
            </div>
          </div>

          <Chat messages={chatMessages} onSendMessage={sendChatMessage} disabled={!connected} />
        </div>
      </div>
    </div>
  );
}

