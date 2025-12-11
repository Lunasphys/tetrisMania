import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { getSession } from '../services/sessionService';

/**
 * Send a game invitation to a friend
 */
export async function sendGameInvitation(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to send game invitations',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { to_user_id, session_code } = req.body;

    if (!to_user_id) {
      res.status(400).json({ 
        error: 'User ID is required',
        details: 'Please provide the user ID of the friend you want to invite',
        code: 'MISSING_USER_ID'
      });
      return;
    }

    if (!session_code) {
      res.status(400).json({ 
        error: 'Session code is required',
        details: 'Please provide the session code of the game',
        code: 'MISSING_SESSION_CODE'
      });
      return;
    }

    // Verify session exists
    const session = getSession(session_code);
    if (!session) {
      res.status(404).json({ 
        error: 'Session not found',
        details: `No session found with code: ${session_code}`,
        code: 'SESSION_NOT_FOUND'
      });
      return;
    }

    // Verify user is player1 in the session
    if (session.player1_id !== req.user.id) {
      res.status(403).json({ 
        error: 'Not authorized',
        details: 'Only the session creator can invite friends',
        code: 'NOT_SESSION_CREATOR'
      });
      return;
    }

    if (to_user_id === req.user.id) {
      res.status(400).json({ 
        error: 'Cannot invite yourself',
        details: 'You cannot send a game invitation to yourself',
        code: 'CANNOT_INVITE_SELF'
      });
      return;
    }

    // Check if invitation already exists
    const { data: existing } = await supabase
      .from('game_invitations')
      .select('*')
      .eq('from_user_id', req.user.id)
      .eq('to_user_id', to_user_id)
      .eq('session_code', session_code)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      res.status(400).json({ 
        error: 'Invitation already sent',
        details: 'You have already sent a pending invitation to this user for this session',
        code: 'INVITATION_EXISTS'
      });
      return;
    }

    const { data, error } = await supabase
      .from('game_invitations')
      .insert({
        from_user_id: req.user.id,
        to_user_id,
        session_code,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[GameInvitationsController] Error sending invitation:', error);
      res.status(500).json({ 
        error: 'Failed to send game invitation',
        details: error.message || 'Database error occurred while creating invitation',
        code: 'INVITATION_CREATE_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.status(201).json({ message: 'Game invitation sent', invitation: data });
  } catch (error: any) {
    console.error('[GameInvitationsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Get pending game invitations (received)
 */
export async function getPendingInvitations(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to view game invitations',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { data, error } = await supabase
      .from('game_invitations')
      .select('id, from_user_id, session_code, created_at')
      .eq('to_user_id', req.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GameInvitationsController] Error fetching invitations:', error);
      res.status(500).json({ 
        error: 'Failed to fetch invitations',
        details: error.message || 'Database error occurred',
        code: 'INVITATIONS_FETCH_ERROR',
        supabaseError: error.message
      });
      return;
    }

    // Get user details for each invitation
    if (data && data.length > 0) {
      const userIds = data.map(inv => inv.from_user_id);
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (!usersError && users) {
        const invitationsWithUsers = data.map(invitation => {
          const user = users.find(u => u.id === invitation.from_user_id);
          return {
            ...invitation,
            user: user || { id: invitation.from_user_id, username: null }
          };
        });
        res.json({ invitations: invitationsWithUsers });
        return;
      }
    }

    res.json({ invitations: data || [] });
  } catch (error: any) {
    console.error('[GameInvitationsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Accept a game invitation
 */
export async function acceptGameInvitation(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to accept game invitations',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { invitation_id } = req.body;

    if (!invitation_id) {
      res.status(400).json({ 
        error: 'Invitation ID is required',
        details: 'Please provide the invitation ID to accept',
        code: 'MISSING_INVITATION_ID'
      });
      return;
    }

    const { data: invitation, error: fetchError } = await supabase
      .from('game_invitations')
      .select('*')
      .eq('id', invitation_id)
      .eq('to_user_id', req.user.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      res.status(404).json({ 
        error: 'Invitation not found',
        details: `No pending invitation found with ID: ${invitation_id}`,
        code: 'INVITATION_NOT_FOUND',
        providedInvitationId: invitation_id
      });
      return;
    }

    // Verify session still exists
    const session = getSession(invitation.session_code);
    if (!session) {
      // Mark invitation as expired
      await supabase
        .from('game_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation_id);
      
      res.status(404).json({ 
        error: 'Session expired',
        details: 'The game session for this invitation no longer exists',
        code: 'SESSION_EXPIRED'
      });
      return;
    }

    // Update invitation status
    const { error } = await supabase
      .from('game_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation_id);

    if (error) {
      console.error('[GameInvitationsController] Error accepting invitation:', error);
      res.status(500).json({ 
        error: 'Failed to accept invitation',
        details: error.message || 'Database error occurred',
        code: 'INVITATION_ACCEPT_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.json({ 
      message: 'Invitation accepted',
      session_code: invitation.session_code
    });
  } catch (error: any) {
    console.error('[GameInvitationsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Reject a game invitation
 */
export async function rejectGameInvitation(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to reject game invitations',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { invitation_id } = req.body;

    if (!invitation_id) {
      res.status(400).json({ 
        error: 'Invitation ID is required',
        details: 'Please provide the invitation ID to reject',
        code: 'MISSING_INVITATION_ID'
      });
      return;
    }

    const { error } = await supabase
      .from('game_invitations')
      .update({ status: 'rejected' })
      .eq('id', invitation_id)
      .eq('to_user_id', req.user.id);

    if (error) {
      console.error('[GameInvitationsController] Error rejecting invitation:', error);
      res.status(500).json({ 
        error: 'Failed to reject invitation',
        details: error.message || 'Database error occurred',
        code: 'INVITATION_REJECT_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.json({ message: 'Invitation rejected' });
  } catch (error: any) {
    console.error('[GameInvitationsController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

