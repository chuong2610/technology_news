import { qaApiClient, qaGenerationApiClient } from './config';

export const qaApi = {
  // Get all QA tests - GET /api/qas/
  getAllQA: async () => {
    try {
      const response = await qaApiClient.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all QA tests:', error);
      throw error;
    }
  },

  // Get QA by ID - GET /api/qas/{qa_id}
  getQAById: async (qaId) => {
    try {
      const response = await qaApiClient.get(`/${qaId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching QA test:', error);
      throw error;
    }
  },

  // Get QA tests by article ID - GET /api/qas/article/{article_id}
  getQAByArticleId: async (articleId) => {
    try {
      const response = await qaApiClient.get(`/article/${articleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching QA tests for article:', error);
      throw error;
    }
  },

  // Create new QA test - POST /api/qas/
  createQA: async (qaData) => {
    try {
      const response = await qaApiClient.post('/', qaData);
      return response.data;
    } catch (error) {
      console.error('Error creating QA test:', error);
      throw error;
    }
  },

  // Update QA test - PUT /api/qas/{qa_id}
  updateQA: async (qaId, qaData) => {
    try {
      const response = await qaApiClient.put(`/${qaId}`, qaData);
      return response.data;
    } catch (error) {
      console.error('Error updating QA test:', error);
      throw error;
    }
  },

  // Delete QA test - DELETE /api/qas/{qa_id}
  deleteQA: async (qaId) => {
    try {
      const response = await qaApiClient.delete(`/${qaId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting QA test:', error);
      throw error;
    }
  },

  // Generate QA test using AI - POST /api/qa-generation/
  generateQA: async (articleData) => {
    try {
      const response = await qaGenerationApiClient.post('/qa-generation/', articleData);
      return response.data;
    } catch (error) {
      console.error('Error generating QA test:', error);
      throw error;
    }
  }
};
