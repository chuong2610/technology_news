import { qaResultsApiClient } from './config';

export const qaResultsApi = {
  // Get all QA results - GET /api/qas-results/
  getAllQAResults: async () => {
    try {
      const response = await qaResultsApiClient.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all QA results:', error);
      throw error;
    }
  },

  // Submit QA result - POST /api/qas-results/
  submitQAResult: async (qaId, userId, userAnswers) => {
    try {
      const payload = {
        qa_id: qaId,
        user_id: userId,
        qa: userAnswers
      };
      const response = await qaResultsApiClient.post('/', payload);
      return response.data;
    } catch (error) {
      console.error('Error submitting QA result:', error);
      throw error;
    }
  },

  // Get test history for a specific user and QA test - GET /api/qas-results/user/{user_id}/qa/{qa_id}
  getTestHistory: async (userId, qaId) => {
    try {
      const response = await qaResultsApiClient.get(`/user/${userId}/qa/${qaId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching test history:', error);
      throw error;
    }
  },

  // Get specific QA result by ID - GET /api/qas-results/{qa_result_id}
  getQAResultById: async (qaResultId) => {
    try {
      const response = await qaResultsApiClient.get(`/${qaResultId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching QA result:', error);
      throw error;
    }
  }
};
