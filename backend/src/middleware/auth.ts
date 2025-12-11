import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isGuest?: boolean;
  };
}

/**
 * Middleware to authenticate requests (optional - allows guests)
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    // Allow guest access
    req.user = undefined;
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      req.user = undefined;
      return next();
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      isGuest: false,
    };
    next();
  } catch (error) {
    req.user = undefined;
    next();
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      isGuest: false,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

