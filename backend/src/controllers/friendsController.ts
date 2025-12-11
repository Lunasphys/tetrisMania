import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

/**
 * Send a friend request
 */
export async function sendFriendRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { to_user_id } = req.body;

    if (!to_user_id || to_user_id === req.user.id) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Check if request already exists
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(from_user_id.eq.${req.user.id},to_user_id.eq.${to_user_id}),and(from_user_id.eq.${to_user_id},to_user_id.eq.${req.user.id})`)
      .single();

    if (existing) {
      res.status(400).json({ error: 'Friend request already exists' });
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
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'Friend request sent', request: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { request_id } = req.body;

    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', request_id)
      .eq('to_user_id', req.user.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      res.status(404).json({ error: 'Friend request not found' });
      return;
    }

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', request_id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: 'Friend request accepted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Refuse a friend request
 */
export async function refuseFriendRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { request_id } = req.body;

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', request_id)
      .eq('to_user_id', req.user.id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: 'Friend request refused' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Get user's friends list
 */
export async function getFriends(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(from_user_id.eq.${req.user.id},status.eq.accepted),and(to_user_id.eq.${req.user.id},status.eq.accepted)`);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Extract friend IDs
    const friends = (data || []).map((request) =>
      request.from_user_id === req.user!.id ? request.to_user_id : request.from_user_id
    );

    // Get friend user details
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, username')
      .in('id', friends);

    if (usersError) {
      res.status(500).json({ error: usersError.message });
      return;
    }

    res.json({ friends: users || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

