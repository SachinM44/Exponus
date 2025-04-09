import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { toast } from 'react-hot-toast';

export interface Blog {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  authorId: number;
  author: {
    id: number;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  comments?: number;
}

// Fetch all blogs
export const useBlogs = () => {
  return useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/blog/bulk');
      return response.data.blogs as Blog[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Fetch single blog
export const useBlog = (id: number) => {
  return useQuery({
    queryKey: ['blog', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/blog/${id}`);
      return response.data.blog as Blog;
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