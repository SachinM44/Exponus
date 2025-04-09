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
    const errorMessage = error.response?.data?.message || 'Something went wrong';
    
    // Show a toast notification
    toast.error(errorMessage);
    
    // Logout if token is invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 