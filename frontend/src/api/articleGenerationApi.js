import { articleGenerationApiClient } from './config';

export const articleGenerationApi = {
  // Generate an article - POST /api/article-generation/generate
  generateArticle: async (params) => {
    try {
      const response = await articleGenerationApiClient.post('/article-generation/generate', {
        query: params.query,
        input_text: params.inputText || '',
        article_type: params.articleType || 'informative',
        length: params.length || 'medium',
        tone: params.tone || 'professional',
        output_format: params.outputFormat || 'markdown'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating article:', error);
      throw error;
    }
  },

  // Get article suggestions - POST /api/article-generation/suggestions
  getArticleSuggestions: async (query) => {
    try {
      const response = await articleGenerationApiClient.post('/article-generation/suggestions', {
        query: query
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting article suggestions:', error);
      throw error;
    }
  },

  // Get generation config - GET /api/article-generation/config
  getGenerationConfig: async () => {
    try {
      const response = await articleGenerationApiClient.get('/article-generation/config');
      
      return response.data;
    } catch (error) {
      console.error('Error getting generation config:', error);
      throw error;
    }
  }
};
