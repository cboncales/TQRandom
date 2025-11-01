import { defineStore } from "pinia";
import { ref } from "vue";
import { testApi, questionApi, answerApi } from "@/services/api";

export const useTestStore = defineStore("testStore", () => {
  // ============================================
  // CACHE STATE
  // ============================================
  
  const testsCache = ref(null);
  const testsCacheTime = ref(null);
  const questionsCache = ref({}); // { testId: { data, timestamp } }
  const singleTestCache = ref({}); // { testId: { data, timestamp } }
  const answersCache = ref({}); // { testId: { data, timestamp } }
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Check if cache is valid
   */
  function isCacheValid(timestamp) {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
  }
  
  /**
   * Clear all cache
   */
  function clearCache() {
    testsCache.value = null;
    testsCacheTime.value = null;
    questionsCache.value = {};
    singleTestCache.value = {};
    answersCache.value = {};
  }
  
  /**
   * Clear specific test cache
   */
  function clearTestCache(testId) {
    if (testId) {
      delete questionsCache.value[testId];
      delete singleTestCache.value[testId];
      delete answersCache.value[testId];
    }
    testsCache.value = null;
    testsCacheTime.value = null;
  }

  // ============================================
  // TEST MANAGEMENT
  // ============================================

  /**
   * Create a new test
   */
  async function createTest(title, description) {
    try {
      const result = await testApi.createTest(title, description);
      
      if (result.error) {
        return { error: result.error };
      }

      // Invalidate tests cache
      testsCache.value = null;
      testsCacheTime.value = null;

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get all tests for the authenticated user (with caching)
   */
  async function getUserTests(forceRefresh = false) {
    try {
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid(testsCacheTime.value)) {
        return { data: testsCache.value };
      }

      const result = await testApi.getUserTests();
      
      if (result.error) {
        return { error: result.error };
      }

      // Update cache
      testsCache.value = result.data.data;
      testsCacheTime.value = Date.now();

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get a single test by ID (with caching)
   */
  async function getTest(testId, forceRefresh = false) {
    try {
      // Check cache
      const cached = singleTestCache.value[testId];
      if (!forceRefresh && cached && isCacheValid(cached.timestamp)) {
        return { data: cached.data };
      }

      const result = await testApi.getTest(testId);
      
      if (result.error) {
        return { error: result.error };
      }

      // Update cache
      singleTestCache.value[testId] = {
        data: result.data.data,
        timestamp: Date.now(),
      };

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Update a test
   */
  async function updateTest(testId, updates) {
    try {
      const result = await testApi.updateTest(testId, updates);
      
      if (result.error) {
        return { error: result.error };
      }

      // Invalidate cache for this test
      clearTestCache(testId);

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Delete a test
   */
  async function deleteTest(testId) {
    try {
      const result = await testApi.deleteTest(testId);
      
      if (result.error) {
        return { error: result.error };
      }

      // Invalidate all related caches
      clearTestCache(testId);

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  // ============================================
  // QUESTION MANAGEMENT
  // ============================================

  /**
   * Create a new question with answer choices
   */
  async function createQuestion(testId, questionText, answerChoices) {
    try {
      const result = await questionApi.createQuestion(testId, questionText, answerChoices);
      
      if (result.error) {
        return { error: result.error };
      }

      // Invalidate questions cache for this test
      delete questionsCache.value[testId];

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get all questions for a test with their answer choices (with caching)
   */
  async function getTestQuestions(testId, forceRefresh = false) {
    try {
      // Check cache
      const cached = questionsCache.value[testId];
      if (!forceRefresh && cached && isCacheValid(cached.timestamp)) {
        const cacheAge = Math.floor((Date.now() - cached.timestamp) / 1000);
        return { data: cached.data };
      }

      const result = await questionApi.getTestQuestions(testId);
      
      if (result.error) {
        return { error: result.error };
      }

      // Update cache
      questionsCache.value[testId] = {
        data: result.data.data,
        timestamp: Date.now(),
      };

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Update a question and its answer choices
   */
  async function updateQuestion(questionId, questionText, answerChoices, testId = null) {
    try {
      const result = await questionApi.updateQuestion(questionId, questionText, answerChoices);
      
      if (result.error) {
        return { error: result.error };
      }

      // Invalidate questions cache for this test if testId provided
      if (testId) {
        delete questionsCache.value[testId];
      } else {
        // Clear all questions cache if testId not provided
        questionsCache.value = {};
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Delete a question and its answer choices
   */
  async function deleteQuestion(questionId, testId = null) {
    try {
      const result = await questionApi.deleteQuestion(questionId);
      
      if (result.error) {
        return { error: result.error };
      }

      // Invalidate questions cache for this test if testId provided
      if (testId) {
        delete questionsCache.value[testId];
      } else {
        // Clear all questions cache if testId not provided
        questionsCache.value = {};
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  // ============================================
  // ANSWER MANAGEMENT
  // ============================================

  /**
   * Store the correct answer for a question
   */
  async function storeCorrectAnswer(questionId, answerChoiceId, testId = null) {
    try {
      const result = await answerApi.storeCorrectAnswer(questionId, answerChoiceId);
      
      if (result.error) {
        return { error: result.error };
      }

      // Invalidate answers cache for this test if testId provided
      if (testId) {
        delete answersCache.value[testId];
      }

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get correct answers for a test (with caching)
   */
  async function getCorrectAnswersForTest(testId, forceRefresh = false) {
    try {
      // Check cache
      const cached = answersCache.value[testId];
      if (!forceRefresh && cached && isCacheValid(cached.timestamp)) {
        const cacheAge = Math.floor((Date.now() - cached.timestamp) / 1000);
        return { data: cached.data };
      }

      const result = await answerApi.getCorrectAnswersForTest(testId);
      
      if (result.error) {
        return { error: result.error };
      }

      // Update cache
      answersCache.value[testId] = {
        data: result.data.data,
        timestamp: Date.now(),
      };

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  return {
    // Test management
    createTest,
    getUserTests,
    getTest,
    updateTest,
    deleteTest,
    // Question management
    createQuestion,
    getTestQuestions,
    updateQuestion,
    deleteQuestion,
    // Answer management
    storeCorrectAnswer,
    getCorrectAnswersForTest,
    // Cache management
    clearCache,
    clearTestCache,
  };
});

