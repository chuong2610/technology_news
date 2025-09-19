import { apiClient } from './config';
import { APP_ID } from '../config/appConfig';

export const searchApi = {
  // General AI-powered search (returns both articles and users)
  search: async (query, limit = 12, page = 1, maxResults = 60) => {
    try {
      const response = await apiClient.get('/search/', {
        params: {
          q: query,
          k: Math.min(limit, maxResults),
          page_index: page - 1, // Backend expects 0-based page index
          page_size: Math.min(limit, maxResults),
          app_id: APP_ID
        }
      });
      
      // Handle new response format with both article and user results
      const data = response.data;
      console.log('🔍 [SearchAPI] Raw backend response:', data);
      console.log('🔍 [SearchAPI] Response type:', typeof data);
      console.log('🔍 [SearchAPI] Response keys:', data ? Object.keys(data) : 'null');
      
      if (data && typeof data === 'object') {
        // New format: { article: { results: [...], pagination: {...} }, author: { results: [...], pagination: {...} } }
        if (data.article !== undefined || data.author !== undefined) {
          console.log('🔍 [SearchAPI] Detected new format with article/author properties');
          
          // Extract articles data
          const articleSection = data.article || {};
          const articlesData = articleSection.results || [];
          const articlePagination = articleSection.pagination || {};
          
          // Extract authors data  
          const authorSection = data.author || {};
          const authorsData = authorSection.results || [];
          const authorPagination = authorSection.pagination || {};
          
          console.log('🔍 [SearchAPI] Articles:', articlesData.length, 'items');
          console.log('🔍 [SearchAPI] Authors:', authorsData.length, 'items');
          console.log('🔍 [SearchAPI] Article pagination:', articlePagination);
          console.log('🔍 [SearchAPI] Author pagination:', authorPagination);
          
          const result = {
            success: true,
            articles: Array.isArray(articlesData) ? articlesData : [],
            users: Array.isArray(authorsData) ? authorsData : [], // Keep 'users' for frontend compatibility
            // Maintain backward compatibility
            data: articlesData.length > 0 ? articlesData : authorsData,
            search_type: articlesData.length > 0 ? 'articles' : 'authors',
            // Use article pagination if articles exist, otherwise author pagination
            pagination: articlesData.length > 0 ? articlePagination : authorPagination,
            // Store both paginations for advanced use
            articlePagination: articlePagination,
            authorPagination: authorPagination
          };
          
          console.log('🔍 [SearchAPI] Returning processed result:', result);
          return result;
        }
        // Fallback to original format
        console.log('🔍 [SearchAPI] Using fallback to original format');
        return data;
      }
      
      return response.data;
    } catch (error) {
      console.error('General search error:', error);
      return { success: false, articles: [], users: [], data: [], error: 'Search failed' };
    }
  },

  // Search articles specifically
  searchArticles: async (query, limit = 12, page = 1, maxResults = 60) => {
    try {
      const response = await apiClient.get('/search/articles', {
        params: {
          q: query,
          k: Math.min(limit, maxResults),
          page_index: page - 1, // Backend expects 0-based page index
          page_size: Math.min(limit, maxResults),
          app_id: APP_ID
        }
      });
      return response.data;
    } catch (error) {
      console.error('Articles search error:', error);
      return { success: false, data: [], error: 'Articles search failed' };
    }
  },

  // Search authors specifically
  searchAuthors: async (query, limit = 12, page = 1, maxResults = 60) => {
    try {
      const response = await apiClient.get('/search/authors', {
        params: {
          q: query,
          k: Math.min(limit, maxResults),
          page_index: page - 1, // Backend expects 0-based page index
          page_size: Math.min(limit, maxResults),
          app_id: APP_ID
        }
      });
      return response.data;
    } catch (error) {
      console.error('Authors search error:', error);
      return { success: false, data: [], error: 'Authors search failed' };
    }
  }
};

export default searchApi;
