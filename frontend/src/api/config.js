import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL, QA_API_URL } from '../config/appConfig';

// Article Management API (port 8001)
const API_BASE_URL = API_URL || 'http://localhost:8001/api';

// QA & Generation API (port 8000) 
const QA_BASE_URL = QA_API_URL || 'http://localhost:8000/api/qas';

console.log('🔧 API Configuration:');
console.log('🔧 Article API Base URL:', API_BASE_URL);
console.log('🔧 QA API Base URL:', QA_BASE_URL);

// Create Article Management API client (port 8001)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Create Article Management API client for form data (port 8001)
const apiClientFormData = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Create QA API client (port 8000) - for QA operations
const qaApiClient = axios.create({
  baseURL: QA_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Create QA Generation API client (port 8000) - for QA generation
const qaGenerationApiClient = axios.create({
  baseURL: QA_BASE_URL.replace('/api/qas', '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Create Article Generation API client (port 8000) - for article generation
const articleGenerationApiClient = axios.create({
  baseURL: QA_BASE_URL.replace('/api/qas', '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Create QA Results API client (port 8000) - for QA results
const qaResultsApiClient = axios.create({
  baseURL: QA_BASE_URL.replace('/api/qas', '/api/qas-results'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

console.log('🔧 Client Base URLs:');
console.log('🔧 qaApiClient:', qaApiClient.defaults.baseURL);
console.log('🔧 qaGenerationApiClient:', qaGenerationApiClient.defaults.baseURL);
console.log('🔧 articleGenerationApiClient:', articleGenerationApiClient.defaults.baseURL);
console.log('🔧 qaResultsApiClient:', qaResultsApiClient.defaults.baseURL);

// Auth interceptor function
const addAuthInterceptor = (client) => {
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Response interceptor function
const addResponseInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      const { response } = error;
      
      if (response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        localStorage.removeItem('role');
        toast.error('Your session has expired. Please log in again.');
      } else if (response?.status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (response?.status === 404) {
        toast.error('Resource not found.');
      } else if (response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (response?.data?.detail) {
        toast.error(response.data.detail);
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please try again.');
      } else if (!navigator.onLine) {
        toast.error('No internet connection.');
      } else {
        toast.error('An unexpected error occurred.');
      }
      
      return Promise.reject(error);
    }
  );
};

// Apply interceptors to all clients
[apiClient, apiClientFormData, qaApiClient, qaGenerationApiClient, articleGenerationApiClient, qaResultsApiClient].forEach(client => {
  addAuthInterceptor(client);
  addResponseInterceptor(client);
});

// Utility functions
export const getAuthToken = () => localStorage.getItem('access_token');
export const setAuthToken = (token) => localStorage.setItem('access_token', token);
export const removeAuthToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  localStorage.removeItem('user_id');
  localStorage.removeItem('role');
};

export const getUserId = () => {
  return localStorage.getItem('user_id');
};

// Helper function to create FormData for file uploads
export const createFormData = (data) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== null && value !== undefined) {
      // Detect File/Blob or AntD Upload objects (originFileObj)
      const isFileLike = (val) => {
        if (!val) return false;
        if (val instanceof File || val instanceof Blob) return true;
        // Ant Design Upload may provide an object with originFileObj
        if (val && typeof val === 'object' && (val.originFileObj || (val.name && val.size))) return true;
        return false;
      };

      if (isFileLike(value)) {
        // support AntD Upload item objects
        const fileObj = value.originFileObj ? value.originFileObj : value;
        formData.append(key, fileObj);
      } else if (Array.isArray(value)) {
        formData.append(key, value.join(','));
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  
  return formData;
};

// API response wrapper
export const apiResponse = {
  success: (data, message = 'Success') => ({ data, message, success: true }),
  error: (error, message = 'Error occurred') => ({ 
    error, 
    message: error?.response?.data?.detail || message, 
    success: false 
  })
};

// Export all clients
export { 
  apiClient, 
  apiClientFormData, 
  qaApiClient, 
  qaGenerationApiClient,
  articleGenerationApiClient,
  qaResultsApiClient
};

export default apiClient;
