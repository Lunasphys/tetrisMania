import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { friendsService, Friend, PendingRequest } from '../services/friendsService';
import { leaderboardService, Score } from '../services/leaderboardService';
import { supabase } from '../config/supabase';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user, signOut } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewingFriendId, setViewingFriendId] = useState<string | null>(userId || null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const targetUserId = viewingFriendId || user.id;
        
        // Load user profile (username) if viewing own profile
        if (!viewingFriendId || viewingFriendId === user.id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          
          if (!profileError && profile) {
            setProfileUsername(profile.username);
          } else {
            // Fallback to email prefix if no username
            setProfileUsername(user.email?.split('@')[0] || null);
          }
        }
        
        const [friendsData, pendingData, scoresData] = await Promise.all([
          friendsService.getFriends(),
          friendsService.getPendingRequests(),
          leaderboardService.getUserScores(targetUserId),
        ]);
        setFriends(friendsData);
        setPendingRequests(pendingData);
        setScores(scoresData.slice(0, 10)); // Show last 10 scores
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, viewingFriendId]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearchUser = async () => {
    const trimmedUsername = searchUsername.trim();
    if (!trimmedUsername) {
      alert('Veuillez entrer un pseudo à rechercher');
      return;
    }
    
    // Minimum 2 characters for search
    if (trimmedUsername.length < 2) {
      alert('Veuillez entrer au moins 2 caractères pour la recherche');
      return;
    }
    
    console.log('[ProfilePage] Searching for:', trimmedUsername);
    setSearching(true);
    setSearchResults([]); // Clear previous results
    
    try {
      const results = await friendsService.searchUser(trimmedUsername);
      console.log('[ProfilePage] Search results:', results);
      setSearchResults(results);
      
      if (results.length === 0) {
        // Don't show alert, just show empty state in UI
        console.log('[ProfilePage] No users found');
      }
    } catch (error: any) {
      console.error('[ProfilePage] Search error:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message || 'Erreur lors de la recherche';
      alert(errorMessage);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequestByUsername = async (targetUsername: string) => {
    try {
      await friendsService.sendRequestByUsername(targetUsername);
      alert('Demande d\'ami envoyée !');
      setSearchUsername('');
      setSearchResults([]);
    } catch (error: any) {
      alert(error.response?.data?.details || 'Erreur lors de l\'envoi de la demande');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendsService.acceptRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      const [friendsData] = await Promise.all([friendsService.getFriends()]);
      setFriends(friendsData);
      alert('Demande acceptée !');
    } catch (error: any) {
      alert(error.response?.data?.details || 'Erreur lors de l\'acceptation');
    }
  };

  const handleRefuseRequest = async (requestId: string) => {
    try {
      await friendsService.refuseRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      alert('Demande refusée');
    } catch (error: any) {
      alert(error.response?.data?.details || 'Erreur lors du refus');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet ami ?')) return;
    try {
      await friendsService.removeFriend(friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
      if (viewingFriendId === friendId) {
        setViewingFriendId(null);
      }
      alert('Ami supprimé');
    } catch (error: any) {
      alert(error.response?.data?.details || 'Erreur lors de la suppression');
    }
  };

  const handleViewFriendProfile = async (friendId: string) => {
    setViewingFriendId(friendId);
    setLoading(true);
    try {
      const scoresData = await leaderboardService.getUserScores(friendId);
      setScores(scoresData.slice(0, 10));
    } catch (error) {
      console.error('Failed to load friend scores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="profile-page">Loading...</div>;
  }

  const isViewingFriend = viewingFriendId && viewingFriendId !== user?.id;
  const viewingFriend = isViewingFriend ? friends.find(f => f.id === viewingFriendId) : null;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>{isViewingFriend ? `Profil de ${viewingFriend?.username || 'ami'}` : 'Profile'}</h1>
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Home
        </button>

        {isViewingFriend && (
          <div className="profile-section">
            <h2>Informations</h2>
            <div className="profile-info">
              <div>
                <strong>Pseudo:</strong> {viewingFriend?.username || `Utilisateur ${viewingFriendId.substring(0, 8)}`}
              </div>
              <div>
                <strong>User ID:</strong> {viewingFriendId}
              </div>
            </div>
            <button onClick={() => setViewingFriendId(null)} className="back-to-profile-button">
              ← Retour à mon profil
            </button>
          </div>
        )}

        {!isViewingFriend && (
          <>
            <div className="profile-section">
              <h2>Account Info</h2>
              <div className="profile-info">
                <div>
                  <strong>Pseudo:</strong> {profileUsername || user?.email?.split('@')[0] || 'Non défini'}
                </div>
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
              <h2>Amis ({friends.length})</h2>
          {friends.length === 0 ? (
            <div className="empty-state">Aucun ami pour le moment</div>
          ) : (
            <div className="friends-list">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-item">
                  <div className="friend-info">
                    <span className="friend-name">{friend.username || `Utilisateur ${friend.id.substring(0, 8)}`}</span>
                  </div>
                  <div className="friend-actions">
                    <button 
                      onClick={() => handleViewFriendProfile(friend.id)}
                      className="view-profile-button"
                    >
                      👤 Voir profil
                    </button>
                    <button 
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="remove-friend-button"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>

            <div className="profile-section">
              <h2>Demandes d'amis en attente ({pendingRequests.length})</h2>
          {pendingRequests.length === 0 ? (
            <div className="empty-state">Aucune demande en attente</div>
          ) : (
            <div className="pending-requests-list">
              {pendingRequests.map((request) => (
                <div key={request.id} className="request-item">
                  <div className="request-info">
                    <span className="request-username">
                      {request.user?.username || `Utilisateur ${request.from_user_id.substring(0, 8)}`}
                    </span>
                    <span className="request-date">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="request-actions">
                    <button 
                      onClick={() => handleAcceptRequest(request.id)}
                      className="accept-button"
                    >
                      ✓ Accepter
                    </button>
                    <button 
                      onClick={() => handleRefuseRequest(request.id)}
                      className="refuse-button"
                    >
                      ✗ Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>

            <div className="profile-section">
              <h2>Rechercher un ami</h2>
          <div className="search-friends">
            <input
              type="text"
              placeholder="Entrez un pseudo..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
              className="search-input"
            />
            <button 
              onClick={(e) => {
                e.preventDefault();
                console.log('[ProfilePage] Search button clicked, username:', searchUsername);
                handleSearchUser();
              }}
              disabled={searching || !searchUsername.trim()}
              className="search-button"
              type="button"
            >
              {searching ? 'Recherche...' : '🔍 Rechercher'}
            </button>
          </div>
          {searching && (
            <div className="search-results">
              <p style={{ color: '#aaa', textAlign: 'center' }}>Recherche en cours...</p>
            </div>
          )}
          {!searching && searchResults.length > 0 && (
            <div className="search-results">
              <h3>Résultats de recherche ({searchResults.length})</h3>
              {searchResults.map((user) => (
                <div key={user.id} className="search-result-item">
                  <span className="result-username">{user.username || 'Sans pseudo'}</span>
                  <button 
                    onClick={() => handleSendRequestByUsername(user.username || '')}
                    className="send-request-button"
                  >
                    ➕ Demander en ami
                  </button>
                </div>
              ))}
            </div>
          )}
          {!searching && searchResults.length === 0 && searchUsername.trim().length >= 2 && (
            <div className="search-results">
              <p className="no-results">Aucun utilisateur trouvé avec "{searchUsername}"</p>
            </div>
          )}
            </div>
          </>
        )}

        <div className="profile-section">
          <h2>
            {isViewingFriend 
              ? `Scores de ${viewingFriend?.username || 'ami'}`
              : 'Mes scores récents'}
          </h2>
          {scores.length === 0 ? (
            <div className="empty-state">Aucun score pour le moment</div>
          ) : (
            <div className="scores-list">
              {scores.map((score) => (
                <div key={score.id} className="score-item">
                  <div>
                    <strong>{score.score.toLocaleString()}</strong> points
                  </div>
                  <div>{score.lines_cleared} lignes</div>
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

