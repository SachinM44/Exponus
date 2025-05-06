import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { toast } from 'react-hot-toast';
import { Blog, BlogResponse, BlogsResponse } from '../types';

// Define parameters for the hook
interface UseBlogsParams {
    page?: number;
    pageSize?: number;
    // Add other filters like searchTerm here if implementing backend search
}

// Fetch all blogs with pagination
export const useBlogs = (params: UseBlogsParams = {}) => {
  const { page = 1, pageSize = 10 } = params;
  
  return useQuery<BlogsResponse, Error>({
    // Include query params in the queryKey for proper caching
    queryKey: ['blogs', { page, pageSize }], 
    queryFn: async () => {
      // Construct query string
      const queryString = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      }).toString();
      
      // apiClient.get already returns response.data due to Axios typings
      // We need to return the data structure directly
      const response = await apiClient.get<BlogsResponse>(`/api/v1/blog/bulk?${queryString}`);
      return response.data; // Return the data property from the Axios response object
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
};

// Fetch single blog
export const useBlog = (id: number) => {
  return useQuery<BlogResponse, Error>({
    queryKey: ['blog', id],
    queryFn: async () => {
      const { data } = await apiClient.get<BlogResponse>(`/api/v1/blog/${id}`);
      if (!data?.blog) throw new Error('Blog not found');
      return data;
    },
    enabled: !!id,
  });
};

// Create blog
export const useCreateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await apiClient.post('/api/v1/blog', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog created successfully');
    },
    onError: () => {
      toast.error('Failed to create blog');
    },
  });
};

// Update blog
export const useUpdateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: number; title: string; content: string }) => {
      const response = await apiClient.put('/api/v1/blog', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blog', variables.id] });
      toast.success('Blog updated successfully');
    },
    onError: () => {
      toast.error('Failed to update blog');
    },
  });
};

// Fetch blogs by user ID
export const useUserBlogs = (userId: number, params: UseBlogsParams = {}) => {
  const { page = 1, pageSize = 5 } = params;
  
  return useQuery<BlogsResponse, Error>({
    queryKey: ['userBlogs', userId, { page, pageSize }],
    queryFn: async () => {
      // Construct query string
      const queryString = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      }).toString();
      
      const response = await apiClient.get<BlogsResponse>(`/api/v1/blog/user/${userId}?${queryString}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};