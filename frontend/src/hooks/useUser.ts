import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Define the UserProfile type based on backend response
export interface UserProfile {
  id: number;
  name: string | null;
  username: string; 
  avatar: string | null;
  bio: string | null;
}

// Define the type for profile update data
interface UpdateProfileData {
  name?: string;
  bio?: string;
  avatar?: string; // Expecting the S3 URL string now
}

// --- React Query Hooks ---

// Hook to fetch the current user's profile
export const useUser = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const queryResult = useQuery<UserProfile, Error>({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Don't throw error here, allow component to handle logged-out state
        // Returning null or undefined might be better, but queryFn expects Promise<UserProfile>
        // Let's throw to indicate the query shouldn't run / is disabled functionally
        throw new Error('Not authenticated'); 
      }
      // apiClient interceptor adds the token header
      const { data } = await apiClient.get<UserProfile>('/api/v1/user/profile');
      return data;
    },
    enabled: !!localStorage.getItem('token'),
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error: any) => {
        // Check error status using optional chaining and check for response existence
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
            return false; // Don't retry auth errors
        }
        return failureCount < 1;
    },
  });

  // Handle side effects like logout navigation based on query state
  useEffect(() => {
      if (queryResult.isError && queryResult.error) {
          const error: any = queryResult.error; // Temporary any type
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
              console.error('Authentication error detected in useUser:', error);
              const currentToken = localStorage.getItem('token');
              if (currentToken) {
                  localStorage.removeItem('token');
                  queryClient.removeQueries({ queryKey: ['user', 'profile'] });
                  queryClient.invalidateQueries(); // Invalidate all queries on logout
                  toast.error('Session expired. Please sign in again.');
                  navigate('/signin', { replace: true, state: { from: window.location.pathname } });
              }
          }
      }
  }, [queryResult.isError, queryResult.error, navigate, queryClient]);

  return queryResult;
};

// Hook to update the user's profile
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfileData>({
    mutationFn: async (updateData) => {
      const { data } = await apiClient.put<UserProfile>('/api/v1/user/profile', updateData);
      return data;
    },
    onSuccess: (updatedProfile) => {
      // Update cache directly for immediate feedback
      queryClient.setQueryData(['user', 'profile'], updatedProfile);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      // Use error message from response if available
      const message = error?.message || 'Failed to update profile';
      toast.error(message);
    },
  });
};

// Hook to get S3 presigned URL
export const useGetPresignedUrl = () => {
    return useMutation<{ presignedUrl: string; objectUrl: string; key: string }, Error, { contentType: string; filename?: string }>({
        mutationFn: async (variables) => {
            const { data } = await apiClient.post('/api/v1/user/avatar/presigned-url', variables);
            return data;
        },
        onError: (error: any) => {
            console.error("Presigned URL error:", error);
            const message = error?.error || error?.message || 'Failed to get upload URL';
            toast.error(message);
        }
    });
}; 