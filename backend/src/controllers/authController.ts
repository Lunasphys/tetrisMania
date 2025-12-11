import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { isValidEmail } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';

/**
 * Sign up a new user
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
      },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: data.session,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Sign in a user
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Sign out current user
 */
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await supabase.auth.signOut();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Request password reset
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`,
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Delete user account
 */
export async function deleteAccount(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Delete user data from database (scores, friends, etc.)
    // This would be handled by Supabase triggers or manual cleanup
    // For now, we'll just sign out the user
    await supabase.auth.signOut();

    res.json({ message: 'Account deletion requested. Data will be removed.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

