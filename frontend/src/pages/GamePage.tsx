import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { gameService } from '../services/gameService';
import { friendsService } from '../services/friendsService';
import { gameInvitationsService } from '../services/gameInvitationsService';
import TetrisGrid from '../components/TetrisGrid';
import Chat from '../components/Chat';
import InviteFriendsList from '../components/InviteFriendsList';
import './GamePage.css';

export default function GamePage() {
    const { sessionCode: urlSessionCode } = useParams();
    const navigate = useNavigate();
    const { user, guestUsername } = useAuth();
    const [sessionCode, setSessionCode] = useState<string>('');
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<'player1' | 'player2' | null>(null);
    const [waitingForPlayer, setWaitingForPlayer] = useState(true);
    const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
    const [sendingInvitation, setSendingInvitation] = useState(false);
    const initializingRef = useRef(false); // Prevent double initialization

    // Initialize game session
    useEffect(() => {
        // Prevent double execution
        if (initializingRef.current) {
            console.log('[GamePage] Already initializing, skipping...');
            return;
        }

        const initializeGame = async () => {
            initializingRef.current = true;

            try {
                const displayName = guestUsername || (user?.email?.split('@')[0]) || 'Player';
                setUsername(displayName);

                if (!urlSessionCode) {
                    // CREATING A NEW SESSION
                    console.log('[GamePage] Creating new session...');

                    const result = await gameService.createSession(displayName);
                    const code = result.session.code.toUpperCase();
                    const serverPlayerId = result.playerId;

                    console.log(`[GamePage] ✓ Created session ${code}`);
                    console.log(`[GamePage]   - playerId: ${serverPlayerId}`);
                    console.log(`[GamePage]   - player1_id: ${result.session.player1_id}`);
                    console.log(`[GamePage]   - You should be player1`);

                    // Store playerId immediately
                    localStorage.setItem(`playerId_${code}`, serverPlayerId);
                    console.log(`[GamePage] ✓ Stored playerId in localStorage: playerId_${code}`);

                    // Set state
                    setSessionCode(code);
                    setPlayerId(serverPlayerId);
                    setRole('player1');

                    // Navigate to the session page
                    navigate(`/game/${code}`, { replace: true });

                    // Mark as not initializing so the next render can proceed
                    initializingRef.current = false;
                    return;
                }

                // JOINING AN EXISTING SESSION
                const code = urlSessionCode.toUpperCase();
                console.log(`[GamePage] Joining existing session: ${code}`);

                // Check if we already initialized this exact session with a role
                if (sessionCode === code && role && playerId) {
                    console.log(`[GamePage] Already initialized ${code} as ${role}, skipping`);
                    initializingRef.current = false;
                    return;
                }

                // Get stored playerId for this session
                const storageKey = `playerId_${code}`;
                const storedPlayerId = localStorage.getItem(storageKey);

                console.log(`[GamePage] Looking for stored playerId...`);
                console.log(`[GamePage]   - Storage key: ${storageKey}`);
                console.log(`[GamePage]   - Found: ${storedPlayerId || 'null'}`);

                // Debug: show all playerId keys in localStorage
                const allKeys = Object.keys(localStorage).filter(k => k.startsWith('playerId_'));
                if (allKeys.length > 0) {
                    console.log(`[GamePage] All playerId keys in localStorage:`);
                    allKeys.forEach(key => {
                        console.log(`[GamePage]   - ${key} = ${localStorage.getItem(key)}`);
                    });
                }

                setSessionCode(code);

                // Join the session (with stored playerId if available)
                console.log(`[GamePage] Calling joinSession with playerId: ${storedPlayerId || 'undefined'}`);
                const result = await gameService.joinSession(code, displayName, storedPlayerId || undefined);

                const finalPlayerId = result.playerId;
                const finalRole = result.role;

                console.log(`[GamePage] ✓ Joined session ${code}`);
                console.log(`[GamePage]   - Assigned role: ${finalRole}`);
                console.log(`[GamePage]   - playerId: ${finalPlayerId}`);
                console.log(`[GamePage]   - player1_id: ${result.session.player1_id}`);
                console.log(`[GamePage]   - player2_id: ${result.session.player2_id}`);

                // Verify role matches server state
                if (finalRole === 'player1' && result.session.player1_id !== finalPlayerId) {
                    console.error(`[GamePage] ⚠️  MISMATCH: Role is player1 but player1_id doesn't match!`);
                    console.error(`[GamePage]     Expected: ${finalPlayerId}`);
                    console.error(`[GamePage]     Got: ${result.session.player1_id}`);
                }
                if (finalRole === 'player2' && result.session.player2_id !== finalPlayerId) {
                    console.error(`[GamePage] ⚠️  MISMATCH: Role is player2 but player2_id doesn't match!`);
                    console.error(`[GamePage]     Expected: ${finalPlayerId}`);
                    console.error(`[GamePage]     Got: ${result.session.player2_id}`);
                }

                setPlayerId(finalPlayerId);
                setRole(finalRole);

                // Store playerId for future use
                localStorage.setItem(`playerId_${code}`, finalPlayerId);
                console.log(`[GamePage] ✓ Updated localStorage: playerId_${code} = ${finalPlayerId}`);

            } catch (error: any) {
                console.error('[GamePage] ❌ Failed to initialize game:', error);

                // Provide user-friendly error messages
                let errorMessage = 'Failed to initialize game';
                if (error.response?.data?.code === 'SESSION_FULL') {
                    errorMessage = 'This session is full (2 players maximum)';
                } else if (error.response?.data?.code === 'SESSION_NOT_FOUND') {
                    errorMessage = 'Session not found. It may have expired or been closed.';
                } else if (error.response?.data?.details) {
                    errorMessage = error.response.data.details;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                alert(errorMessage);
                navigate('/');
            } finally {
                initializingRef.current = false;
            }
        };

        initializeGame();
    }, [urlSessionCode, navigate]); // Minimal dependencies to prevent re-runs

  // Connect WebSocket when ready
  const { connected, gameState, opponentState, chatMessages, sessionInfo, gameResult, timeRemaining, sendMove, sendChatMessage, leaveSession, startGame } =
    useWebSocket(sessionCode && playerId && username ? sessionCode : null, playerId, username);

  // Format time remaining as MM:SS
  const formatTime = (ms: number | null): string => {
    if (ms === null || ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

    // Update role and waiting state from session info
    useEffect(() => {
        if (sessionInfo?.role) {
            setRole(sessionInfo.role);
        }
        if (sessionInfo?.waiting !== undefined) {
            setWaitingForPlayer(sessionInfo.waiting);
        }
    }, [sessionInfo]);

    // Keyboard controls
    useEffect(() => {
        if (!connected || waitingForPlayer) return;

        const handleKeyPress = (e: KeyboardEvent) => {
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
    }, [connected, waitingForPlayer, sendMove]);

    // Auto-drop piece
    useEffect(() => {
        if (!connected || waitingForPlayer || !gameState || gameState.gameOver) return;

        const interval = setInterval(() => {
            sendMove('down');
        }, 1000);

        return () => clearInterval(interval);
    }, [connected, waitingForPlayer, gameState, sendMove]);

    const handleLeave = () => {
        if (sessionCode) {
            localStorage.removeItem(`playerId_${sessionCode}`);
        }
        leaveSession();
        navigate('/');
    };

    const handleSendFriendRequest = async () => {
        if (!user || !sessionInfo?.session) return;
        
        const opponentId = role === 'player1' 
            ? sessionInfo.session.player2_id 
            : sessionInfo.session.player1_id;
        
        if (!opponentId || opponentId.startsWith('guest_')) {
            alert('Impossible d\'ajouter un invité en ami');
            return;
        }

        setSendingFriendRequest(true);
        try {
            await friendsService.sendRequest(opponentId);
            alert('Demande d\'ami envoyée !');
        } catch (error: any) {
            const message = error.response?.data?.details || error.message || 'Erreur lors de l\'envoi de la demande';
            alert(message);
        } finally {
            setSendingFriendRequest(false);
        }
    };

    const handleInviteFriend = async (friendId: string) => {
        if (!user || !sessionCode) return;

        setSendingInvitation(true);
        try {
            await gameInvitationsService.sendInvitation(friendId, sessionCode);
            alert('Invitation envoyée !');
        } catch (error: any) {
            const message = error.response?.data?.details || error.message || 'Erreur lors de l\'envoi de l\'invitation';
            alert(message);
        } finally {
            setSendingInvitation(false);
        }
    };

    if (!connected || !playerId || !sessionCode) {
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
                    {timeRemaining !== null && !waitingForPlayer && (
                        <div className="timer-display" style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: timeRemaining < 30000 ? '#f00' : timeRemaining < 60000 ? '#ffa500' : '#0f0',
                            marginTop: '10px'
                        }}>
                            ⏱️ {formatTime(timeRemaining)}
                        </div>
                    )}
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

                    {gameResult && (
                        <div className="game-result-screen">
                            <h2>
                                {gameResult.winner === 'tie' ? '🤝 Match nul !' :
                                 gameResult.winner === role ? '🎉 Vous avez gagné !' :
                                 '😔 Vous avez perdu'}
                            </h2>
                            <div className="result-details">
                                <p className="result-reason">
                                    {gameResult.reason === 'timeout' ? '⏱️ Temps écoulé (2 minutes)' : '🎮 Game Over'}
                                </p>
                                <div className="scores-comparison">
                                    <div className={`player-score ${gameResult.winner === 'player1' ? 'winner' : ''}`}>
                                        <h3>{gameResult.player1Username || 'Player 1'}</h3>
                                        <p className="score-value">{gameResult.player1Score.toLocaleString()}</p>
                                        <p className="lines-value">{gameResult.player1LinesCleared} lignes</p>
                                    </div>
                                    <div className="vs-divider">VS</div>
                                    <div className={`player-score ${gameResult.winner === 'player2' ? 'winner' : ''}`}>
                                        <h3>{gameResult.player2Username || 'Player 2'}</h3>
                                        <p className="score-value">{gameResult.player2Score.toLocaleString()}</p>
                                        <p className="lines-value">{gameResult.player2LinesCleared} lignes</p>
                                    </div>
                                </div>
                                <p className="result-message">
                                    {gameResult.winner === 'tie' 
                                        ? 'Les deux joueurs ont le même score !'
                                        : gameResult.winner === role
                                        ? `Félicitations ! Vous avez gagné avec ${gameResult.winnerScore.toLocaleString()} points !`
                                        : `Le gagnant est ${gameResult.winner === 'player1' ? gameResult.player1Username : gameResult.player2Username} avec ${gameResult.winnerScore.toLocaleString()} points.`}
                                </p>
                                <button onClick={handleLeave} className="leave-button">
                                    Retour à l'accueil
                                </button>
                            </div>
                        </div>
                    )}

                    {!gameResult && waitingForPlayer && (
                        <div className="waiting-screen">
                            <h2>
                                {sessionInfo?.bothPlayersConnected
                                    ? 'Both players connected!'
                                    : 'Waiting for second player...'}
                            </h2>
                            <p>Session Code: <strong>{sessionCode}</strong></p>
                            {!sessionInfo?.bothPlayersConnected ? (
                                <>
                                    <p>Share this code with another player to start the game.</p>
                                    <p>Waiting for player 2 to join...</p>
                                </>
                            ) : (
                                <>
                                    <p>Player 1: <strong>{sessionInfo?.session?.player1_username}</strong></p>
                                    <p>Player 2: <strong>{sessionInfo?.session?.player2_username}</strong></p>
                                    {sessionInfo?.canStart && role === 'player1' && (
                                        <button
                                            onClick={startGame}
                                            className="start-game-button"
                                            disabled={!connected}
                                        >
                                            🎮 Start Game
                                        </button>
                                    )}
                                    {role === 'player2' && (
                                        <p className="waiting-message">Waiting for player 1 to start the game...</p>
                                    )}
                                </>
                            )}
                        </div>
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

                    {sessionInfo?.session && !waitingForPlayer && user && role === 'player1' && (
                        <div className="opponent-actions">
                            <h3>Inviter un ami</h3>
                            <InviteFriendsList 
                                onInvite={handleInviteFriend}
                                disabled={sendingInvitation || !connected}
                            />
                        </div>
                    )}

                    {sessionInfo?.session && !waitingForPlayer && user && (
                        <div className="opponent-actions">
                            <h3>Adversaire</h3>
                            <p className="opponent-name">
                                {role === 'player1' 
                                    ? sessionInfo.session.player2_username 
                                    : sessionInfo.session.player1_username}
                            </p>
                            {(role === 'player1' ? sessionInfo.session.player2_id : sessionInfo.session.player1_id)?.startsWith('guest_') ? (
                                <p className="guest-notice">Invité - ne peut pas être ajouté en ami</p>
                            ) : (
                                <button 
                                    onClick={handleSendFriendRequest}
                                    disabled={sendingFriendRequest || !connected}
                                    className="add-friend-button"
                                >
                                    {sendingFriendRequest ? 'Envoi...' : '➕ Demander en ami'}
                                </button>
                            )}
                        </div>
                    )}

                    <Chat messages={chatMessages} onSendMessage={sendChatMessage} disabled={!connected} />
                </div>
            </div>
        </div>
    );
}