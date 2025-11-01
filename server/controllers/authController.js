import { supabase } from '../config/supabase.js';

/**
 * Register a new user
 */
export async function register(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for development
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) {
      console.error('Registration error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name: firstName,
        last_name: lastName,
      },
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
}

/**
 * Login user
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ error: error.message });
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...data.user.user_metadata,
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}

/**
 * Logout user
 */
export async function logout(req, res) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ message: 'Logged out successfully' });
    }

    const token = authHeader.substring(7);

    // Sign out from Supabase
    await supabase.auth.admin.signOut(token);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout:', error);
    // Don't fail logout even if there's an error
    res.json({ message: 'Logged out successfully' });
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;

    // Get user from Supabase
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data.user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        ...data.user.user_metadata,
      },
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(req, res) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ error: error.message });
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error) {
    console.error('Error in refreshToken:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
}

/**
 * Request password reset
 */
export async function resetPasswordRequest(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error in resetPasswordRequest:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
}

/**
 * Update password
 */
export async function updatePassword(req, res) {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      console.error('Password update error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in updatePassword:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
}

/**
 * Sign in with Google (initiate OAuth flow)
 */
export async function signInWithGoogle(req, res) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.CLIENT_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error('Google OAuth error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ url: data.url });
  } catch (error) {
    console.error('Error in signInWithGoogle:', error);
    res.status(500).json({ error: 'Failed to initiate Google sign-in' });
  }
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth callback error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...data.user.user_metadata,
      },
    });
  } catch (error) {
    console.error('Error in handleOAuthCallback:', error);
    res.status(500).json({ error: 'Failed to process OAuth callback' });
  }
}

