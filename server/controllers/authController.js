import { supabase } from '../config/supabase.js';

/**
 * Register a new user
 */
export async function register(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Email, password, and first name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName || null,
          full_name: `${firstName} ${lastName || ''}`.trim()
        }
      }
    });

    if (authError) {
      console.error('Registration error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    res.status(201).json({
      message: 'Registration successful',
      user: authData.user
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
      password
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user
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
    // Supabase handles token invalidation
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await supabase.auth.admin.signOut(token);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout:', error);
    // Even if there's an error, we should allow logout
    res.json({ message: 'Logged out successfully' });
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: data.user });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
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

    res.json({ message: 'Password reset email sent. Please check your inbox.' });
  } catch (error) {
    console.error('Error in resetPasswordRequest:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
}

/**
 * Update password (for authenticated users - used in settings)
 */
export async function updatePassword(req, res) {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
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
 * Confirm password reset (when user clicks email link and submits new password)
 */
export async function confirmPasswordReset(req, res) {
  try {
    const { access_token, new_password } = req.body;

    if (!access_token || !new_password) {
      return res.status(400).json({ error: 'Access token and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Set the session using the recovery token
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token: access_token, // For password reset, use the same token
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    // Update the password
    const { data, error } = await supabase.auth.updateUser({
      password: new_password
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'Password reset successfully',
      user: data.user 
    });
  } catch (error) {
    console.error('Error in confirmPasswordReset:', error);
    res.status(500).json({ error: 'Failed to reset password' });
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
    const { code } = req.body;

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
      user: data.user
    });
  } catch (error) {
    console.error('Error in handleOAuthCallback:', error);
    res.status(500).json({ error: 'Failed to complete OAuth sign-in' });
  }
}

export default {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  resetPasswordRequest,
  updatePassword,
  confirmPasswordReset,
  signInWithGoogle,
  handleOAuthCallback
};
