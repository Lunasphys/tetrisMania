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

    if (!req.user || req.user.id !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ scores: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Save a score
 */
export async function saveScore(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { score, lines_cleared, session_code, username } = req.body;

    if (!score || score < 0) {
      res.status(400).json({ error: 'Valid score is required' });
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
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'Score saved', score: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

