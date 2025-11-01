import { defineStore } from "pinia";
import { testApi, questionApi, answerApi } from "@/services/api";

export const useTestStore = defineStore("testStore", () => {
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

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get all tests for the authenticated user
   */
  async function getUserTests() {
    try {
      const result = await testApi.getUserTests();
      
      if (result.error) {
        return { error: result.error };
      }

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get a single test by ID
   */
  async function getTest(testId) {
    try {
      const result = await testApi.getTest(testId);
      
      if (result.error) {
        return { error: result.error };
      }

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

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get all questions for a test with their answer choices
   */
  async function getTestQuestions(testId) {
    try {
      const result = await questionApi.getTestQuestions(testId);
      
      if (result.error) {
        return { error: result.error };
      }

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Update a question and its answer choices
   */
  async function updateQuestion(questionId, questionText, answerChoices) {
    try {
      const result = await questionApi.updateQuestion(questionId, questionText, answerChoices);
      
      if (result.error) {
        return { error: result.error };
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Delete a question and its answer choices
   */
  async function deleteQuestion(questionId) {
    try {
      const result = await questionApi.deleteQuestion(questionId);
      
      if (result.error) {
        return { error: result.error };
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
  async function storeCorrectAnswer(questionId, answerChoiceId) {
    try {
      const result = await answerApi.storeCorrectAnswer(questionId, answerChoiceId);
      
      if (result.error) {
        return { error: result.error };
      }

      return { data: result.data.data };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get correct answers for a test
   */
  async function getCorrectAnswersForTest(testId) {
    try {
      const result = await answerApi.getCorrectAnswersForTest(testId);
      
      if (result.error) {
        return { error: result.error };
      }

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
  };
});

