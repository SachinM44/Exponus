import axios from 'axios';
import { BACKEND_URL } from '../config';
import toast from 'react-hot-toast';

// Create a custom axios instance
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure Content-Type is set for all POST and PUT requests
    if ((config.method === 'post' || config.method === 'put') && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Log the request details for debugging
    console.log(`[API Client] ${config.method?.toUpperCase()} ${config.url}`, { 
      headers: config.headers,
      data: config.data 
    });
    
    // Return the config
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Get the error message
    const errorMessage = error.response?.data?.message || 
                         (error.message === 'Network Error' ? 'Could not connect to server' : 'Something went wrong');
    
    // Show a toast notification, except maybe for auth errors handled by useUser
    if (!(error.response?.status === 401 || error.response?.status === 403)) {
        toast.error(errorMessage);
    }
    
    // Remove automatic logout/redirect - this should be handled by UI/hooks based on query state
    /*
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    */
    
    // Return the error enriched with response data if possible
    return Promise.reject(error.response ? error.response.data : error);
    // Or just re-reject the original error for React Query to handle
    // return Promise.reject(error);
  }
);

export default apiClient; 