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
            // Store new tokens
            setAuthToken(refreshResult.data.access_token);
            setRefreshToken(refreshResult.data.refresh_token);
            
            // Retry the original request with new token
            return apiRequest(endpoint, options, retryCount + 1);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
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
    return apiRequest(`/api/auth/callback?code=${code}`, {
      method: 'GET',
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

