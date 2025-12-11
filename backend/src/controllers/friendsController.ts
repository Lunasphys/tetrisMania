import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

/**
 * Send a friend request
 */
export async function sendFriendRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to send friend requests',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { to_user_id } = req.body;

    if (!to_user_id) {
      res.status(400).json({ 
        error: 'User ID is required',
        details: 'Please provide the user ID of the person you want to add as a friend',
        code: 'MISSING_USER_ID'
      });
      return;
    }

    if (to_user_id === req.user.id) {
      res.status(400).json({ 
        error: 'Cannot add yourself as a friend',
        details: 'You cannot send a friend request to yourself',
        code: 'CANNOT_ADD_SELF'
      });
      return;
    }

    // Check if request already exists
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(from_user_id.eq.${req.user.id},to_user_id.eq.${to_user_id}),and(from_user_id.eq.${to_user_id},to_user_id.eq.${req.user.id})`)
      .single();

    if (existing) {
      const status = existing.status;
      res.status(400).json({ 
        error: 'Friend request already exists',
        details: status === 'pending' 
          ? 'You already have a pending friend request with this user'
          : status === 'accepted'
          ? 'This user is already your friend'
          : 'You previously sent a friend request to this user',
        code: 'FRIEND_REQUEST_EXISTS',
        currentStatus: status
      });
      return;
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: req.user.id,
        to_user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[FriendsController] Error sending friend request:', error);
      res.status(500).json({ 
        error: 'Failed to send friend request',
        details: error.message || 'Database error occurred while creating friend request',
        code: 'FRIEND_REQUEST_CREATE_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.status(201).json({ message: 'Friend request sent', request: data });
  } catch (error: any) {
    console.error('[FriendsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to accept friend requests',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { request_id } = req.body;

    if (!request_id) {
      res.status(400).json({ 
        error: 'Request ID is required',
        details: 'Please provide the friend request ID to accept',
        code: 'MISSING_REQUEST_ID'
      });
      return;
    }

    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', request_id)
      .eq('to_user_id', req.user.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      res.status(404).json({ 
        error: 'Friend request not found',
        details: `No pending friend request found with ID: ${request_id}. The request may have already been processed or does not exist.`,
        code: 'FRIEND_REQUEST_NOT_FOUND',
        providedRequestId: request_id
      });
      return;
    }

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', request_id);

    if (error) {
      console.error('[FriendsController] Error accepting friend request:', error);
      res.status(500).json({ 
        error: 'Failed to accept friend request',
        details: error.message || 'Database error occurred',
        code: 'FRIEND_REQUEST_ACCEPT_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.json({ message: 'Friend request accepted' });
  } catch (error: any) {
    console.error('[FriendsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Refuse a friend request
 */
export async function refuseFriendRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to refuse friend requests',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { request_id } = req.body;

    if (!request_id) {
      res.status(400).json({ 
        error: 'Request ID is required',
        details: 'Please provide the friend request ID to refuse',
        code: 'MISSING_REQUEST_ID'
      });
      return;
    }

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', request_id)
      .eq('to_user_id', req.user.id);

    if (error) {
      console.error('[FriendsController] Error refusing friend request:', error);
      res.status(500).json({ 
        error: 'Failed to refuse friend request',
        details: error.message || 'Database error occurred',
        code: 'FRIEND_REQUEST_REFUSE_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.json({ message: 'Friend request refused' });
  } catch (error: any) {
    console.error('[FriendsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Search user by username or email
 */
export async function searchUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to search for users',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { username, email } = req.query;

    if (!username && !email) {
      res.status(400).json({ 
        error: 'Search parameter required',
        details: 'Please provide either username or email to search',
        code: 'MISSING_SEARCH_PARAM'
      });
      return;
    }

    // Search in profiles table by username
    let query = supabase
      .from('profiles')
      .select('id, username')
      .neq('id', req.user.id); // Exclude current user

    if (username) {
      // Use exact match first, then partial match
      query = query.ilike('username', `%${username}%`);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      console.error('[FriendsController] Error searching users:', error);
      res.status(500).json({ 
        error: 'Failed to search users',
        details: error.message || 'Database error occurred',
        code: 'USER_SEARCH_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.json({ users: data || [] });
  } catch (error: any) {
    console.error('[FriendsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Send friend request by username
 */
export async function sendFriendRequestByUsername(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to send friend requests',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { username } = req.body;

    if (!username) {
      res.status(400).json({ 
        error: 'Username is required',
        details: 'Please provide the username of the person you want to add as a friend',
        code: 'MISSING_USERNAME'
      });
      return;
    }

    // Find user by username (case-insensitive)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .maybeSingle();
    
    // If no exact match, try partial match
    let foundProfile = profile;
    if (!foundProfile) {
      const { data: partialMatches } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', `%${username}%`)
        .limit(1);
      
      if (partialMatches && partialMatches.length > 0) {
        foundProfile = partialMatches[0];
      }
    }

    if (profileError || !foundProfile) {
      res.status(404).json({ 
        error: 'User not found',
        details: `No user found with username: ${username}`,
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    const to_user_id = foundProfile.id;

    if (to_user_id === req.user.id) {
      res.status(400).json({ 
        error: 'Cannot add yourself as a friend',
        details: 'You cannot send a friend request to yourself',
        code: 'CANNOT_ADD_SELF'
      });
      return;
    }

    // Check if request already exists
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(from_user_id.eq.${req.user.id},to_user_id.eq.${to_user_id}),and(from_user_id.eq.${to_user_id},to_user_id.eq.${req.user.id})`)
      .single();

    if (existing) {
      const status = existing.status;
      res.status(400).json({ 
        error: 'Friend request already exists',
        details: status === 'pending' 
          ? 'You already have a pending friend request with this user'
          : status === 'accepted'
          ? 'This user is already your friend'
          : 'You previously sent a friend request to this user',
        code: 'FRIEND_REQUEST_EXISTS',
        currentStatus: status
      });
      return;
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: req.user.id,
        to_user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[FriendsController] Error sending friend request:', error);
      res.status(500).json({ 
        error: 'Failed to send friend request',
        details: error.message || 'Database error occurred while creating friend request',
        code: 'FRIEND_REQUEST_CREATE_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.status(201).json({ message: 'Friend request sent', request: data });
  } catch (error: any) {
    console.error('[FriendsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingRequests(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to view friend requests',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, created_at')
      .eq('to_user_id', req.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FriendsController] Error fetching pending requests:', error);
      res.status(500).json({ 
        error: 'Failed to fetch pending requests',
        details: error.message || 'Database error occurred',
        code: 'PENDING_REQUESTS_FETCH_ERROR',
        supabaseError: error.message
      });
      return;
    }

    // Get user details for each request
    if (data && data.length > 0) {
      const userIds = data.map(r => r.from_user_id);
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (!usersError && users) {
        const requestsWithUsers = data.map(request => {
          const user = users.find(u => u.id === request.from_user_id);
          return {
            ...request,
            user: user || { id: request.from_user_id, username: null }
          };
        });
        res.json({ requests: requestsWithUsers });
        return;
      }
    }

    res.json({ requests: data || [] });
  } catch (error: any) {
    console.error('[FriendsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Remove/Delete a friend
 */
export async function removeFriend(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to remove friends',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { friend_id } = req.body;

    if (!friend_id) {
      res.status(400).json({ 
        error: 'Friend ID is required',
        details: 'Please provide the friend ID to remove',
        code: 'MISSING_FRIEND_ID'
      });
      return;
    }

    // Delete the friend relationship (accepted request)
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`and(from_user_id.eq.${req.user.id},to_user_id.eq.${friend_id},status.eq.accepted),and(from_user_id.eq.${friend_id},to_user_id.eq.${req.user.id},status.eq.accepted)`);

    if (error) {
      console.error('[FriendsController] Error removing friend:', error);
      res.status(500).json({ 
        error: 'Failed to remove friend',
        details: error.message || 'Database error occurred',
        code: 'FRIEND_REMOVE_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.json({ message: 'Friend removed successfully' });
  } catch (error: any) {
    console.error('[FriendsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Get user's friends list
 */
export async function getFriends(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to view your friends list',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(from_user_id.eq.${req.user.id},status.eq.accepted),and(to_user_id.eq.${req.user.id},status.eq.accepted)`);

    if (error) {
      console.error('[FriendsController] Error fetching friend requests:', error);
      res.status(500).json({ 
        error: 'Failed to fetch friend requests',
        details: error.message || 'Database error occurred while retrieving friend requests',
        code: 'FRIEND_REQUESTS_FETCH_ERROR',
        supabaseError: error.message
      });
      return;
    }

    // Extract friend IDs
    const friends = (data || []).map((request) =>
      request.from_user_id === req.user!.id ? request.to_user_id : request.from_user_id
    );

    if (friends.length === 0) {
      res.json({ friends: [] });
      return;
    }

    // Get friend user details from profiles table
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', friends);

    if (usersError) {
      console.error('[FriendsController] Error fetching friend user details:', usersError);
      res.status(500).json({ 
        error: 'Failed to fetch friend details',
        details: usersError.message || 'Database error occurred while retrieving friend user information',
        code: 'FRIEND_DETAILS_FETCH_ERROR',
        supabaseError: usersError.message
      });
      return;
    }

    res.json({ friends: users || [] });
  } catch (error: any) {
    console.error('[FriendsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

