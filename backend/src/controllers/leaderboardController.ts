import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

/**
 * Get global leaderboard
 */
export async function getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ leaderboard: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Get user's score history
 */
export async function getUserScores(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to view your score history',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    if (req.user.id !== id) {
      res.status(403).json({ 
        error: 'Access denied',
        details: `You can only view your own scores. You tried to access scores for user ID: ${id}, but you are logged in as: ${req.user.id}`,
        code: 'ACCESS_DENIED',
        requestedUserId: id,
        yourUserId: req.user.id
      });
      return;
    }

    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[LeaderboardController] Error fetching user scores:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user scores',
        details: error.message || 'Database error occurred while retrieving scores',
        code: 'USER_SCORES_FETCH_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.json({ scores: data || [] });
  } catch (error: any) {
    console.error('[LeaderboardController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Save a score
 */
export async function saveScore(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { score, lines_cleared, session_code, username } = req.body;

    if (score === undefined || score === null) {
      res.status(400).json({ 
        error: 'Score is required',
        details: 'Please provide a valid score value (number >= 0)',
        code: 'MISSING_SCORE'
      });
      return;
    }

    if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
      res.status(400).json({ 
        error: 'Invalid score value',
        details: `Score must be a non-negative integer. Received: ${score}`,
        code: 'INVALID_SCORE',
        providedScore: score
      });
      return;
    }

    const scoreData: any = {
      user_id: req.user?.id || null,
      username: username || (req.user ? req.user.email?.split('@')[0] : 'Guest'),
      score: parseInt(score),
      lines_cleared: parseInt(lines_cleared) || 0,
      session_code: session_code || null,
    };

    const { data, error } = await supabase.from('scores').insert(scoreData).select().single();

    if (error) {
      console.error('[LeaderboardController] Error saving score:', error);
      res.status(500).json({ 
        error: 'Failed to save score',
        details: error.message || 'Database error occurred while saving score',
        code: 'SCORE_SAVE_ERROR',
        supabaseError: error.message
      });
      return;
    }

    res.status(201).json({ message: 'Score saved', score: data });
  } catch (error: any) {
    console.error('[LeaderboardController] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  }
}

