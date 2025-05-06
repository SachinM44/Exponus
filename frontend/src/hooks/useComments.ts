import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import toast from 'react-hot-toast';
import { Comment, CommentsResponse } from '../types';

interface AddCommentData {
    content: string;
}

// Hook to fetch comments for a specific blog post
export const useComments = (blogId: number) => {
  return useQuery<CommentsResponse, Error>({
    queryKey: ['comments', blogId], // Unique key per blog
    queryFn: async () => {
      const { data } = await apiClient.get<CommentsResponse>(`/api/v1/blog/${blogId}/comment`);
      return data;
    },
    enabled: !!blogId,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
};

// Hook to add a comment to a blog post
export const useAddComment = (blogId: number) => {
  const queryClient = useQueryClient();

  return useMutation<Comment, Error, AddCommentData>({
    mutationFn: async (commentData) => {
      const { data } = await apiClient.post<Comment>(`/api/v1/blog/${blogId}/comment`, commentData);
      return data;
    },
    onSuccess: (newComment) => {
      // Optimistically update the cache or invalidate
      queryClient.invalidateQueries({ queryKey: ['comments', blogId] });
      // Alternatively, update cache directly:
      /*
      queryClient.setQueryData(['comments', blogId], (oldData: CommentsResponse | undefined) => {
          const newComments = oldData ? [newComment, ...oldData.comments] : [newComment];
          return { comments: newComments };
      });
      */
      toast.success('Comment added successfully');
    },
    onError: (error) => {
        console.error("Failed to add comment:", error);
        toast.error(error.message || 'Failed to add comment');
    },
  });
};