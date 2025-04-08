import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { Signin } from './pages/Signin';
import Blog from './pages/Blog';
import { Blogs } from './pages/Blogs';
import { Publish } from './pages/Publish';
import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAppDispatch } from './store/hooks';
import { fetchUserProfile } from './store/slices/userSlice';
import apiClient from './lib/apiClient';
import toast from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
});

// Separate component to use router hooks
function AppContent() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Check authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, user is not authenticated');
        return;
      }

      try {
        // Directly fetch user profile to check if token is valid
        await apiClient.get('/api/v1/user/profile');
        
        // If successful, fetch user profile
        dispatch(fetchUserProfile());
      } catch (error) {
        console.error('Authentication check failed:', error);
        
        // Clear token if it's invalid
        localStorage.removeItem('token');
        toast.error('Your session has expired. Please sign in again.');
        navigate('/signin');
      }
    };

    checkAuth();
  }, [dispatch, navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        
        <Route path="/blog/:id" element={
          <ProtectedRoute>
            <Blog />
          </ProtectedRoute>
        } />
        
        <Route path="/blogs" element={<Blogs />} />
        
        <Route path="/publish" element={
          <ProtectedRoute>
            <Publish />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/blogs" />} />
      </Routes>
    </>
  );
}

// Main App component without router hooks
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;