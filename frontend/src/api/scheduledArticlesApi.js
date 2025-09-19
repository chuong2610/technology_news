import { qaGenerationApiClient } from './config';

const APP_ID = process.env.REACT_APP_ID || 'tech_news_app';

export const scheduledArticlesApi = {
  // Fetch new articles from news sources
  fetchNews: async () => {
    try {
      const response = await qaGenerationApiClient.get('/news', {
        params: { app_id: APP_ID }
      });
      return response.data;
    } catch (error) {
      console.error('Fetch news error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch news' 
      };
    }
  },

  // Get pending articles from Redis
  getPendingArticles: async (page = 1, limit = 20, status = null, search = null) => {
    try {
      const params = { 
        page, 
        limit, 
        app_id: APP_ID 
      };
      
      if (status) params.status = status;
      if (search) params.search = search;

      const response = await qaGenerationApiClient.get('/news/pending', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Get pending articles error:', error);
      return { 
        success: false, 
        data: [], 
        error: error.response?.data?.detail || 'Failed to fetch pending articles' 
      };
    }
  },

  // Accept and publish a scheduled article (convert to main article)
  acceptArticle: async (articleId, articleData = null) => {
    try {
      // First, call the accept endpoint to get the article data
      const acceptResponse = await qaGenerationApiClient.post(`/news/accept/${articleId}`, {
        app_id: APP_ID,
        ...(articleData && articleData)
      });
      
      if (!acceptResponse.data.success) {
        return acceptResponse.data;
      }

      // Then, save the article using the existing article API
      const { articleApi } = await import('./articleApi');
      const articleToSave = acceptResponse.data.data;
      
      // Transform the article data to match the expected format
      const articlePayload = {
        title: articleToSave.title,
        abstract: articleToSave.abstract,
        content: articleToSave.content,
        tags: Array.isArray(articleToSave.tags) ? articleToSave.tags : [],
        image_url: articleToSave.image_url || articleToSave.image || '',
        status: 'published'
      };

      const createResult = await articleApi.createArticle(articlePayload);
      
      if (createResult.success) {
        return {
          success: true,
          message: 'Article accepted and published successfully',
          data: createResult.data
        };
      } else {
        return {
          success: false,
          error: 'Failed to save article to main collection'
        };
      }
      
    } catch (error) {
      console.error('Accept article error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to accept article' 
      };
    }
  },

  // Bulk accept multiple articles
  bulkAcceptArticles: async (articleIds) => {
    try {
      const response = await qaGenerationApiClient.post('/news/bulk-accept', {
        article_ids: articleIds,
        app_id: APP_ID
      });
      return response.data;
    } catch (error) {
      console.error('Bulk accept articles error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to accept articles' 
      };
    }
  },

  // Delete a scheduled article
  deleteScheduledArticle: async (articleId) => {
    try {
      const response = await qaGenerationApiClient.delete(`/news/pending/${articleId}`, {
        params: { app_id: APP_ID }
      });
      return response.data;
    } catch (error) {
      console.error('Delete scheduled article error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to delete article' 
      };
    }
  },

  // Delete pending article using news API endpoint
  deletePendingArticle: async (articleId) => {
    try {
      console.log(`🗑️ Deleting pending article with ID: ${articleId}`);
      console.log(`🔗 API endpoint: /news/${articleId}`);
      
      const response = await qaGenerationApiClient.delete(`/news/${articleId}`, {
        params: { app_id: APP_ID }
      });
      
      console.log(`✅ Delete response:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Delete pending article error:', error);
      console.error('❌ Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to delete article' 
      };
    }
  },

  // Bulk delete multiple articles
  bulkDeleteArticles: async (articleIds) => {
    try {
      const response = await qaGenerationApiClient.post('/news/bulk-delete', {
        article_ids: articleIds,
        app_id: APP_ID
      });
      return response.data;
    } catch (error) {
      console.error('Bulk delete articles error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to delete articles' 
      };
    }
  },

  // Update a scheduled article
  updateScheduledArticle: async (articleId, articleData) => {
    try {
      const response = await qaGenerationApiClient.put(`/news/scheduled/${articleId}`, {
        ...articleData,
        app_id: APP_ID
      });
      return response.data;
    } catch (error) {
      console.error('Update scheduled article error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to update article' 
      };
    }
  },

  // Get a single scheduled article by ID
  getScheduledArticle: async (articleId) => {
    try {
      const response = await qaGenerationApiClient.get(`/news/scheduled/${articleId}`, {
        params: { app_id: APP_ID }
      });
      return response.data;
    } catch (error) {
      console.error('Get scheduled article error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch article' 
      };
    }
  },

  // Get statistics for scheduled articles
  getScheduledArticleStats: async () => {
    try {
      const response = await qaGenerationApiClient.get('/news/stats', {
        params: { app_id: APP_ID }
      });
      return response.data;
    } catch (error) {
      console.error('Get scheduled article stats error:', error);
      return { 
        success: false, 
        data: { total: 0, pending: 0, approved: 0, rejected: 0 },
        error: 'Failed to fetch statistics' 
      };
    }
  }
};