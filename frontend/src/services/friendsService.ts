import api from '../config/api';

export interface Friend {
  id: string;
  username: string | null;
}

export interface PendingRequest {
  id: string;
  from_user_id: string;
  created_at: string;
  user?: {
    id: string;
    username: string | null;
  };
}

export interface SearchUser {
  id: string;
  username: string | null;
}

export const friendsService = {
  sendRequest: async (toUserId: string): Promise<void> => {
    await api.post('/friends/request', { to_user_id: toUserId });
  },

  sendRequestByUsername: async (username: string): Promise<void> => {
    await api.post('/friends/request-by-username', { username });
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

  getPendingRequests: async (): Promise<PendingRequest[]> => {
    const { data } = await api.get('/friends/pending');
    return data.requests;
  },

  searchUser: async (username: string): Promise<SearchUser[]> => {
    const { data } = await api.get(`/friends/search?username=${encodeURIComponent(username)}`);
    return data.users;
  },

  removeFriend: async (friendId: string): Promise<void> => {
    await api.delete('/friends/remove', { data: { friend_id: friendId } });
  },
};

