import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi, setAuthToken, setRefreshToken, clearAuthTokens } from "@/services/api";

export const useAuthUserStore = defineStore("authUser", () => {
  const userData = ref(null);
  const isLoading = ref(false);

  // Computed property to check if user is authenticated
  const isAuthenticated = computed(() => {
    return !!userData.value;
  });

  /**
   * Register a new user
   */
  async function register(email, password, firstName, lastName) {
    try {
      isLoading.value = true;
      const result = await authApi.register(email, password, firstName, lastName);

      if (result.error) {
        return { error: result.error };
      }

      return { success: true, message: result.data.message };
    } catch (error) {
      return { error: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Login user
   */
  async function login(email, password) {
    try {
      isLoading.value = true;
      const result = await authApi.login(email, password);

      if (result.error) {
        return { error: result.error };
      }

      // Store tokens
      setAuthToken(result.data.access_token);
      setRefreshToken(result.data.refresh_token);
      
      // Store user data
      userData.value = result.data.user;
      localStorage.setItem('user', JSON.stringify(result.data.user));

      return { success: true };
    } catch (error) {
      return { error: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Logout user
   */
  async function logout() {
    try {
      isLoading.value = true;
      await authApi.logout();

      // Clear tokens and user data
      clearAuthTokens();
      userData.value = null;

      return { success: true };
    } catch (error) {
      // Even if API call fails, clear local data
      clearAuthTokens();
      userData.value = null;
      return { success: true };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Get current user information
   */
  async function getUserInformation() {
    try {
      // First check if we have cached user data
      const cachedUser = localStorage.getItem('user');
      if (cachedUser && !userData.value) {
        userData.value = JSON.parse(cachedUser);
      }

      // Then fetch fresh data from API
      const result = await authApi.getCurrentUser();

      if (result.error) {
        // If token is invalid, clear everything
        if (result.status === 401) {
          clearAuthTokens();
          userData.value = null;
        }
        return { error: result.error };
      }

      userData.value = result.data.user;
      localStorage.setItem('user', JSON.stringify(result.data.user));

      return { data: result.data.user };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Check if user is authenticated
   */
  async function checkAuth() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      userData.value = null;
      return false;
    }

    // Try to get user information
    const result = await getUserInformation();
    
    if (result.error) {
      return false;
    }

    return true;
  }

  /**
   * Reset password request
   */
  async function resetPassword(email) {
    try {
      isLoading.value = true;
      const result = await authApi.resetPasswordRequest(email);

      if (result.error) {
        return { error: result.error };
      }

      return { success: true, message: result.data.message };
    } catch (error) {
      return { error: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update password
   */
  async function updatePassword(newPassword) {
    try {
      isLoading.value = true;
      const result = await authApi.updatePassword(newPassword);

      if (result.error) {
        return { error: result.error };
      }

      return { success: true, message: result.data.message };
    } catch (error) {
      return { error: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Sign in with Google
   */
  async function signInWithGoogle() {
    try {
      isLoading.value = true;
      const result = await authApi.signInWithGoogle();

      if (result.error) {
        return { error: result.error };
      }

      // Redirect to Google OAuth
      if (result.data.url) {
        window.location.href = result.data.url;
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Handle OAuth callback
   */
  async function handleOAuthCallback(code) {
    try {
      isLoading.value = true;
      const result = await authApi.handleOAuthCallback(code);

      if (result.error) {
        return { error: result.error };
      }

      // Store tokens
      setAuthToken(result.data.access_token);
      setRefreshToken(result.data.refresh_token);
      
      // Store user data
      userData.value = result.data.user;
      localStorage.setItem('user', JSON.stringify(result.data.user));

      return { success: true };
    } catch (error) {
      return { error: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  return {
    userData,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    getUserInformation,
    checkAuth,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    handleOAuthCallback,
  };
});

