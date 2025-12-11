import api from '../config/api';

export interface Friend {
  id: string;
  email: string;
  username?: string;
}

export const friendsService = {
  sendRequest: async (toUserId: string): Promise<void> => {
    await api.post('/friends/request', { to_user_id: toUserId });
  },

  acceptRequest: async (requestId: string): Promise<void> => {
    await api.post('/friends/accept', { request_id: requestId });
  },

  refuseRequest: async (requestId: string): Promise<void> => {
    await api.post('/friends/refuse', { request_id: requestId });
  },

  getFriends: async (): Promise<Friend[]> => {
    const { data } = await api.get('/friends');
    return data.friends;
  },
};

