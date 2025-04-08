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
    // Handle authentication errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      
      // If the status is 401 (Unauthorized) or 403 (Forbidden), clear the token
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        toast.error('Your session has expired. Please sign in again.');
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 