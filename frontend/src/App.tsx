import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { Signin } from './pages/Signin';
import Blog from './pages/Blog';
import { Blogs } from './pages/Blogs';
import { Publish } from './pages/Publish';
import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/ProtectedRoute';
import apiClient from './lib/apiClient';
import toast from 'react-hot-toast';
import { QueryClient, QueryClientProvider, useQueryClient, useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useUser } from './hooks/useUser';
import Appbar from './components/Appbar';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

// Separate component to use router hooks
function AppContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  const { data: userProfile, isLoading, isError, error } = useUser();

  // Paths where the Appbar should be hidden
  const hiddenAppbarPaths = ['/', '/signin'];
  const showAppbar = !hiddenAppbarPaths.includes(location.pathname);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, initial auth check done.');
      setAuthChecked(true);
      return;
    }

    if (!isLoading) {
        if (isError) {
            console.error('Authentication check failed via useUser:', error);
            localStorage.removeItem('token');
            queryClient.removeQueries({ queryKey: ['user', 'profile'] });
            toast.error('Your session has expired. Please sign in again.');
        }
        setAuthChecked(true);
    }
  }, [isLoading, isError, error, queryClient, navigate]);

  return (
    <>
      {showAppbar && <Appbar />}

      <div className={showAppbar ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/blogs" element={<Blogs />} />
          
          <Route 
            path="/blog/:id" 
            element={
              <ProtectedRoute isAuthenticated={!!userProfile && authChecked} isLoading={!authChecked || isLoading}>
                <Blog />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/publish" 
            element={
              <ProtectedRoute isAuthenticated={!!userProfile && authChecked} isLoading={!authChecked || isLoading}>
                <Publish />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute isAuthenticated={!!userProfile && authChecked} isLoading={!authChecked || isLoading}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/blogs" />} />
        </Routes>
      </div>
    </>
  );
}

// Main App component without router hooks
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen w-full">
        <AppContent />
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;