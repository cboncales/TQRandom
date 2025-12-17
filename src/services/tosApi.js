import api from './api';

/**
 * TOS (Table of Specifications) API endpoints
 */
export const tosApi = {
  /**
   * Create a new TOS template
   */
  async createTOSTemplate(templateData) {
    const response = await api.post('/api/tos/templates', templateData);
    return response.data;
  },

  /**
   * Get all TOS templates for the authenticated user
   */
  async getUserTOSTemplates() {
    const response = await api.get('/api/tos/templates');
    return response.data;
  },

  /**
   * Get a single TOS template by ID
   */
  async getTOSTemplate(id) {
    const response = await api.get(`/api/tos/templates/${id}`);
    return response.data;
  },

  /**
   * Update a TOS template
   */
  async updateTOSTemplate(id, templateData) {
    const response = await api.put(`/api/tos/templates/${id}`, templateData);
    return response.data;
  },

  /**
   * Delete a TOS template
   */
  async deleteTOSTemplate(id) {
    const response = await api.delete(`/api/tos/templates/${id}`);
    return response.data;
  },

  /**
   * Link a TOS template to a test
   */
  async linkTOSToTest(testId, tosTemplateId) {
    const response = await api.post('/api/tos/link', {
      testId,
      tosTemplateId
    });
    return response.data;
  },

  /**
   * Get TOS template linked to a test
   */
  async getTestTOS(testId) {
    const response = await api.get(`/api/tos/test/${testId}`);
    return response.data;
  },

  /**
   * Generate test using TOS template
   */
  async generateTestWithTOS(testTitle, tosTemplateId, topic = null, file = null) {
    const formData = new FormData();
    formData.append('testTitle', testTitle);
    formData.append('tosTemplateId', tosTemplateId);
    if (topic) {
      formData.append('topic', topic);
    }
    if (file) {
      formData.append('file', file);
    }

    const response = await api.post('/api/ai/generate-with-tos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default tosApi;
