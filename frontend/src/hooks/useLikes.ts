import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { toast } from 'react-hot-toast';

export interface LikeInfo {
  likesCount: number;
  dislikesCount: number;
  userLike: {
    id: number;
    type: 'LIKE' | 'DISLIKE';
  } | null;
}

// Get likes for a blog post
export const useLikes = (blogId: number) => {
  return useQuery({
    queryKey: ['likes', blogId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/blog/${blogId}/like`);
      return response.data as LikeInfo;
    },
    enabled: !!blogId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Add/update like for a blog post
export const useLikeBlog = (blogId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: 'LIKE' | 'DISLIKE') => {
      const response = await apiClient.post(
        `/api/v1/blog/${blogId}/like`,
        { type }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', blogId] });
    },
    onError: () => {
      toast.error('Failed to update like');
    },
  });
}; 