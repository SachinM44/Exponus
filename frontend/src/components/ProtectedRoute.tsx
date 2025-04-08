import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserProfile } from '../store/slices/userSlice';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectPath?: string;
}

export const ProtectedRoute = ({ 
  children, 
  redirectPath = '/signin' 
}: ProtectedRouteProps) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const { profile, loading, error } = useAppSelector(state => state.user);
  
  useEffect(() => {
    if (token && !profile && !loading && !error) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, token, profile, loading, error]);

  if (!token) {
    toast.error('Please sign in to access this page');
    // Save the attempted URL for redirecting after login
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}; 