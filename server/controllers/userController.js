import { supabase } from '../config/supabase.js';

/**
 * Update user profile (name)
 */
export async function updateProfile(req, res) {
  try {
    const { firstName, lastName } = req.body;
    const userId = req.user.id;

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ error: 'First name is required' });
    }

    // Update user metadata in Supabase Auth
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          first_name: firstName.trim(),
          last_name: lastName ? lastName.trim() : null,
          full_name: `${firstName.trim()} ${lastName ? lastName.trim() : ''}`.trim()
        }
      }
    );

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: data.user
      }
    });

  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

/**
 * Update user password
 */
export async function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword
    });

    if (signInError) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password: newPassword
      }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error in updatePassword:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
}

/**
 * Get current user profile
 */
export async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      data: {
        user: data.user
      }
    });

  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export default {
  updateProfile,
  updatePassword,
  getProfile
};

