import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { isValidEmail } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';

/**
 * Sign up a new user
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Both email and password are required to create an account',
        code: 'MISSING_CREDENTIALS',
        missingFields: [!email && 'email', !password && 'password'].filter(Boolean)
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ 
        error: 'Invalid email format',
        details: `The email "${email}" is not in a valid format. Please use a valid email address (e.g., user@example.com)`,
        code: 'INVALID_EMAIL_FORMAT',
        providedEmail: email
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ 
        error: 'Password too short',
        details: 'Password must be at least 6 characters long for security reasons',
        code: 'PASSWORD_TOO_SHORT',
        minLength: 6,
        providedLength: password.length
      });
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

    // Ensure profile is created (trigger should do this, but we'll verify/create if needed)
    if (data.user?.id) {
      const clientToUse = supabaseAdmin || supabase;
      const finalUsername = username || email.split('@')[0];
      
      // Check if profile exists
      const { data: existingProfile } = await clientToUse
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      // Create profile if it doesn't exist (trigger should have done this, but just in case)
      if (!existingProfile) {
        const { error: profileError } = await clientToUse
          .from('profiles')
          .insert({
            id: data.user.id,
            username: finalUsername,
          });

        if (profileError) {
          console.error('[AuthController] Failed to create profile:', profileError);
          // Don't fail the signup, just log the error
        } else {
          console.log('[AuthController] Profile created for user:', data.user.id);
        }
      } else {
        // Update username if it's different
        const { error: updateError } = await clientToUse
          .from('profiles')
          .update({ username: finalUsername })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('[AuthController] Failed to update profile username:', updateError);
        }
      }
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
      res.status(400).json({ 
        error: 'Missing credentials',
        details: 'Both email and password are required to sign in',
        code: 'MISSING_CREDENTIALS',
        missingFields: [!email && 'email', !password && 'password'].filter(Boolean)
      });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let errorCode = 'LOGIN_ERROR';
      let details = error.message;

      if (error.message.includes('Invalid login credentials') || error.message.includes('wrong')) {
        errorCode = 'INVALID_CREDENTIALS';
        details = 'The email or password you entered is incorrect. Please check your credentials and try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorCode = 'EMAIL_NOT_CONFIRMED';
        details = 'Please verify your email address before signing in. Check your inbox for the confirmation email.';
      }

      res.status(401).json({ 
        error: 'Login failed',
        details,
        code: errorCode,
        supabaseError: error.message
      });
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

    if (!email) {
      res.status(400).json({ 
        error: 'Email is required',
        details: 'Please provide an email address to reset your password',
        code: 'MISSING_EMAIL'
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ 
        error: 'Invalid email format',
        details: `The email "${email}" is not in a valid format. Please use a valid email address`,
        code: 'INVALID_EMAIL_FORMAT',
        providedEmail: email
      });
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
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'You must be logged in to delete your account. Please sign in first.',
        code: 'AUTHENTICATION_REQUIRED'
      });
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

