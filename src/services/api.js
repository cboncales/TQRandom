/**
 * API Service Layer
 * Handles all HTTP requests to the Express backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Token storage keys
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const REMEMBER_ME_KEY = 'remember_me';

/**
 * Get the appropriate storage based on remember me preference
 */
function getStorage() {
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  return rememberMe ? localStorage : sessionStorage;
}

/**
 * Get the auth token from storage
 */
function getAuthToken() {
  // Check both storages (for backward compatibility)
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Set the auth token in storage
 */
export function setAuthToken(token, rememberMe = true) {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  // Store remember me preference
  localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
}

/**
 * Get the refresh token from storage
 */
function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Set the refresh token in storage
 */
export function setRefreshToken(token, rememberMe = true) {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Clear all auth tokens
 */
export function clearAuthTokens() {
  // Clear from both storages
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('user');
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem('user');
}

/**
 * Show session expired notification
 */
function showSessionExpiredNotification() {
  // Create or update notification element
  let notification = document.getElementById('session-expired-notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'session-expired-notification';
    notification.className = 'fixed top-4 right-4 z-[9999] bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in';
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="shrink-0">
          <svg class="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-semibold text-red-800">Session Expired</h3>
          <p class="mt-1 text-xs text-red-700">Your session has expired. Please log in again to continue.</p>
          <button onclick="window.location.href='/login'" class="mt-2 text-xs font-medium text-red-800 hover:text-red-900 underline">
            Go to Login
          </button>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 shrink-0 text-red-400 hover:text-red-600">
          <span class="sr-only">Close</span>
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification && notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }
}

/**
 * Make an authenticated API request with automatic token refresh
 */
async function apiRequest(endpoint, options = {}, retryCount = 0) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // If 401 and we haven't retried yet, try to refresh token
    if (response.status === 401 && retryCount === 0 && !endpoint.includes('/auth/')) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          // Try to refresh the token
          const refreshResult = await authApi.refreshToken(refreshToken);
          if (!refreshResult.error && refreshResult.data) {
            // Store new tokens (preserve remember me preference)
            const rememberMe = localStorage.getItem('remember_me') === 'true';
            setAuthToken(refreshResult.data.access_token, rememberMe);
            setRefreshToken(refreshResult.data.refresh_token, rememberMe);
            
            // Retry the original request with new token
            return apiRequest(endpoint, options, retryCount + 1);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Show session expired notification instead of immediate redirect
          showSessionExpiredNotification();
        }
      } else {
        // No refresh token available
        showSessionExpiredNotification();
      }
    }

    if (!response.ok) {
      return {
        error: data.error || data.message || `HTTP error! status: ${response.status}`,
        status: response.status,
      };
    }

    return { data, status: response.status };
  } catch (error) {
    console.error('API request error:', error);
    return {
      error: error.message || 'Network error occurred',
    };
  }
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export const authApi = {
  /**
   * Register a new user
   */
  async register(email, password, firstName, lastName) {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  },

  /**
   * Login user
   */
  async login(email, password) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Logout user
   */
  async logout() {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Get current user information
   */
  async getCurrentUser() {
    return apiRequest('/api/auth/me', {
      method: 'GET',
    });
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    return apiRequest('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  /**
   * Request password reset
   */
  async resetPasswordRequest(email) {
    return apiRequest('/api/auth/reset-password-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Confirm password reset (with token from email link)
   */
  async confirmPasswordReset(accessToken, newPassword) {
    return apiRequest('/api/auth/reset-password-confirm', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken, new_password: newPassword }),
    });
  },

  /**
   * Update password
   */
  async updatePassword(password) {
    return apiRequest('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  },

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    return apiRequest('/api/auth/google', {
      method: 'GET',
    });
  },

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code) {
    return apiRequest('/api/auth/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
};

// ============================================
// TEST ENDPOINTS
// ============================================

export const testApi = {
  /**
   * Create a new test
   */
  async createTest(title, description) {
    return apiRequest('/api/tests', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  },

  /**
   * Get all tests for the authenticated user
   */
  async getUserTests() {
    return apiRequest('/api/tests', {
      method: 'GET',
    });
  },

  /**
   * Get a single test by ID
   */
  async getTest(testId) {
    return apiRequest(`/api/tests/${testId}`, {
      method: 'GET',
    });
  },

  /**
   * Update a test
   */
  async updateTest(testId, updates) {
    return apiRequest(`/api/tests/${testId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete a test
   */
  async deleteTest(testId) {
    return apiRequest(`/api/tests/${testId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// QUESTION ENDPOINTS
// ============================================

export const questionApi = {
  /**
   * Create a new question with answer choices
   */
  async createQuestion(testId, questionText, answerChoices, questionImageUrl = null) {
    return apiRequest('/api/questions', {
      method: 'POST',
      body: JSON.stringify({ testId, questionText, answerChoices, questionImageUrl }),
    });
  },

  /**
   * Get all questions for a test
   */
  async getTestQuestions(testId) {
    return apiRequest(`/api/questions/test/${testId}`, {
      method: 'GET',
    });
  },

  /**
   * Update a question
   */
  async updateQuestion(questionId, questionText, answerChoices, questionImageUrl = null) {
    return apiRequest(`/api/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify({ questionText, answerChoices, questionImageUrl }),
    });
  },

  /**
   * Delete a question
   */
  async deleteQuestion(questionId) {
    return apiRequest(`/api/questions/${questionId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// ANSWER ENDPOINTS
// ============================================

export const answerApi = {
  /**
   * Store or update the correct answer for a question
   */
  async storeCorrectAnswer(questionId, answerChoiceId) {
    return apiRequest('/api/answers/correct', {
      method: 'POST',
      body: JSON.stringify({ questionId, answerChoiceId }),
    });
  },

  /**
   * Get all correct answers for a test
   */
  async getCorrectAnswersForTest(testId) {
    return apiRequest(`/api/answers/test/${testId}/correct`, {
      method: 'GET',
    });
  },
};

// ============================================
// UPLOAD ENDPOINTS
// ============================================

export const uploadApi = {
  /**
   * Upload and parse a document (PDF or DOCX)
   */
  async uploadDocument(file) {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          error: data.error || data.message || `HTTP error! status: ${response.status}`,
          status: response.status,
        };
      }

      return { data, status: response.status };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        error: error.message || 'Network error occurred',
      };
    }
  },
};

// ============================================
// VERSION ENDPOINTS
// ============================================

export const versionApi = {
  /**
   * Generate randomized versions of a test
   */
  async generateVersions(testId, versionCount, questionsPerVersion) {
    return apiRequest('/api/versions/generate', {
      method: 'POST',
      body: JSON.stringify({ testId, versionCount, questionsPerVersion }),
    });
  },

  /**
   * Get all versions for a test
   */
  async getTestVersions(testId) {
    return apiRequest(`/api/versions/test/${testId}`, {
      method: 'GET',
    });
  },

  /**
   * Get a single version with all questions and answers
   */
  async getVersion(versionId) {
    return apiRequest(`/api/versions/${versionId}`, {
      method: 'GET',
    });
  },

  /**
   * Get answer key for a version
   */
  async getVersionAnswerKey(versionId) {
    return apiRequest(`/api/versions/${versionId}/answer-key`, {
      method: 'GET',
    });
  },

  /**
   * Delete a version
   */
  async deleteVersion(versionId) {
    return apiRequest(`/api/versions/${versionId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// USER ENDPOINTS
// ============================================

export const userApi = {
  /**
   * Get current user profile
   */
  async getProfile() {
    return apiRequest('/api/user/profile', {
      method: 'GET',
    });
  },

  /**
   * Update user profile (name)
   */
  async updateProfile(firstName, lastName) {
    return apiRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ firstName, lastName }),
    });
  },

  /**
   * Update user password
   */
  async updatePassword(currentPassword, newPassword) {
    return apiRequest('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ============================================
// IMAGE ENDPOINTS
// ============================================

export const imageApi = {
  /**
   * Upload a single image
   */
  async uploadImage(file) {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          error: data.error || data.message || `HTTP error! status: ${response.status}`,
          status: response.status,
        };
      }

      return { data, status: response.status };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        error: error.message || 'Network error occurred',
      };
    }
  },
};

export default {
  authApi,
  testApi,
  questionApi,
  answerApi,
  uploadApi,
  versionApi,
  userApi,
  imageApi,
};

