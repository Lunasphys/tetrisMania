import api from '../config/api';

export interface GameInvitation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  session_code: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  user?: {
    id: string;
    username: string | null;
  };
}

export const gameInvitationsService = {
  sendInvitation: async (toUserId: string, sessionCode: string): Promise<void> => {
    await api.post('/game-invitations/send', { to_user_id: toUserId, session_code: sessionCode });
  },

  getPendingInvitations: async (): Promise<GameInvitation[]> => {
    const { data } = await api.get('/game-invitations/pending');
    return data.invitations;
  },

  acceptInvitation: async (invitationId: string): Promise<{ session_code: string }> => {
    const { data } = await api.post('/game-invitations/accept', { invitation_id: invitationId });
    return data;
  },

  rejectInvitation: async (invitationId: string): Promise<void> => {
    await api.post('/game-invitations/reject', { invitation_id: invitationId });
  },
};

