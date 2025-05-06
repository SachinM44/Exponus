// API Base URL Configuration
// In production, this will use the deployed backend URL
// In development, it will use the local development server

// Helper function to determine environment
const isDevelopment = (): boolean => {
  return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// Configure backend URL based on environment
export const BACKEND_URL = isDevelopment() 
  ? "http://127.0.0.1:8787"  // Local development
  : "https://exponus-backend.expo-nus.workers.dev";  // Production deployment

// Other constants
export const APP_NAME = "Exponus";
export const APP_DESCRIPTION = "A modern blogging platform";
