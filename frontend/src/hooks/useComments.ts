import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { toast } from 'react-hot-toast';

export interface Comment {
  id: number;
  content: string;
  userId: number;
  blogId: number;
  createdAt: string;
  user: {
    name: string | null;
    avatar: string | null;
  };
}

// Fetch comments for a blog
export const useComments = (blogId: number) => {
  return useQuery({
    queryKey: ['comments', blogId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/blog/${blogId}/comment`);
      return response.data.comments as Comment[];
    },
    enabled: !!blogId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Add comment
export const useAddComment = (blogId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(
        `/api/v1/blog/${blogId}/comment`,
        { content }
      );
      return response.data.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', blogId] });
      toast.success('Comment added successfully');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });
}; 