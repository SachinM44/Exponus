import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner'; // Use default import for LoadingSpinner

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  isAuthenticated, 
  isLoading 
}) => {
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner or skeleton while checking authentication
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /signin page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  return children;
}; 