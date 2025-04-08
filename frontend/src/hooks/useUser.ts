import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { toast } from 'react-hot-toast';

export interface User {
  id: number;
  name: string | null;
  username: string;
  avatar: string | null;
  bio: string | null;
}

// Fetch current user
export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return null;

      try {
        const response = await apiClient.get('/api/v1/user/profile');
        return response.data as User;
      } catch (error) {
        // If we get a 401/403, the token is invalid - clear it
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          localStorage.removeItem('token');
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry on auth errors
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });
};

// Update user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name?: string;
      avatar?: string;
      bio?: string;
    }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to update your profile');
        throw new Error('Not authenticated');
      }

      const response = await apiClient.put('/api/v1/user/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile updated successfully');
    },
    onError: () => {
      // Error is handled by apiClient interceptor
    },
  });
}; 