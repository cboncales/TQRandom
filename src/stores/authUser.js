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
  async function login(email, password, rememberMe = true) {
    try {
      isLoading.value = true;
      const result = await authApi.login(email, password);

      if (result.error) {
        return { error: result.error };
      }

      // Store tokens (with remember me preference)
      setAuthToken(result.data.access_token, rememberMe);
      setRefreshToken(result.data.refresh_token, rememberMe);
      
      // Store user data
      userData.value = result.data.user;
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(result.data.user));

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

      // Clear test store cache to prevent data leaking between users
      // Import testStore dynamically to avoid circular dependency
      const { useTestStore } = await import('./testStore');
      const testStore = useTestStore();
      testStore.clearCache();

      return { success: true };
    } catch (error) {
      // Even if API call fails, clear local data
      clearAuthTokens();
      userData.value = null;
      
      // Clear cache even on error
      try {
        const { useTestStore } = await import('./testStore');
        const testStore = useTestStore();
        testStore.clearCache();
      } catch (e) {
        console.error('Failed to clear cache:', e);
      }
      
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
      // First check if we have cached user data (check both storages)
      const cachedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
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
      // Store in the appropriate storage based on remember me
      const rememberMe = localStorage.getItem('remember_me') === 'true';
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(result.data.user));

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

    // If we already have user data, consider authenticated
    // This prevents unnecessary API calls on every route change
    if (userData.value) {
      return true;
    }

    // Try to get user information only if we don't have it
    const result = await getUserInformation();
    
    if (result.error) {
      // Only return false, let getUserInformation handle token clearing on 401
      return false;
    }

    return true;
  }

  /**
   * Refresh the access token
   */
  async function refreshAccessToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        return { error: 'No refresh token available' };
      }

      const result = await authApi.refreshToken(refreshToken);
      
      if (result.error) {
        // Refresh failed, clear everything
        clearAuthTokens();
        userData.value = null;
        return { error: result.error };
      }

      // Store new tokens
      setAuthToken(result.data.access_token);
      setRefreshToken(result.data.refresh_token);

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
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

      // Store tokens (OAuth always uses remember me = true)
      setAuthToken(result.data.access_token, true);
      setRefreshToken(result.data.refresh_token, true);
      
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
    refreshAccessToken,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    handleOAuthCallback,
  };
});

