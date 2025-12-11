import { useState, useEffect } from 'react';
import { friendsService, Friend } from '../services/friendsService';
import './InviteFriendsList.css';

interface InviteFriendsListProps {
  onInvite: (friendId: string) => void;
  disabled?: boolean;
}

export default function InviteFriendsList({ onInvite, disabled }: InviteFriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friendsData = await friendsService.getFriends();
        setFriends(friendsData);
      } catch (error) {
        console.error('Failed to load friends:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, []);

  if (loading) {
    return <div className="invite-friends-loading">Chargement des amis...</div>;
  }

  if (friends.length === 0) {
    return (
      <div className="invite-friends-empty">
        <p>Aucun ami pour le moment</p>
        <p className="invite-friends-hint">Ajoutez des amis depuis votre profil pour les inviter</p>
      </div>
    );
  }

  return (
    <div className="invite-friends-list">
      {friends.map((friend) => (
        <div key={friend.id} className="invite-friend-item">
          <span className="friend-name">{friend.username || `Utilisateur ${friend.id.substring(0, 8)}`}</span>
          <button
            onClick={() => onInvite(friend.id)}
            disabled={disabled}
            className="invite-button"
          >
            {disabled ? 'Envoi...' : '🎮 Inviter'}
          </button>
        </div>
      ))}
    </div>
  );
}

