import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import toast from 'react-hot-toast';
import { Like, LikesResponse } from '../types';

// Hook to fetch likes for a specific blog post
export const useLikes = (blogId: number) => {
  return useQuery<LikesResponse, Error>({
    queryKey: ['likes', blogId], // Unique key per blog
    queryFn: async () => {
      // TODO: Update backend to have a dedicated GET /:id/like endpoint
      // For now, assuming we might need to fetch all likes and filter,
      // or adapt if the blog endpoint includes likes.
      // If fetching all likes is needed, this is inefficient.
      // Placeholder: Fetch blog details and hope likes are included?
      // Or create a new backend endpoint: GET /api/v1/blog/:id/likes
      
      // TEMPORARY WORKAROUND: Refetch blog details assuming it might contain likes
      // THIS IS NOT IDEAL - Replace with dedicated like endpoint fetch
      // const { data } = await apiClient.get(`/api/v1/blog/${blogId}`);
      // return { likes: data.blog?.likes || [] }; // Adjust based on actual blog response structure
      
      // Assuming a dedicated endpoint GET /api/v1/blog/{blogId}/likes exists:
      const { data } = await apiClient.get<LikesResponse>(`/api/v1/blog/${blogId}/likes`);
      return data; 
    },
    enabled: !!blogId, // Only run if blogId is valid
    staleTime: 1000 * 60 * 1, // Cache for 1 minute
  });
};

// Hook to update (like/dislike) a blog post
export const useUpdateLike = (blogId: number) => {
  const queryClient = useQueryClient();

  // The mutation function input type only needs the 'type'
  return useMutation<any, Error, { type: 'LIKE' | 'DISLIKE' }>({
    mutationFn: async (variables) => {
      // Backend POST /:id/like handles upsert
      // Only send the 'type' in the body, use blogId from the URL
      const { data } = await apiClient.post(`/api/v1/blog/${blogId}/like`, { type: variables.type });
      return data;
    },
    onSuccess: () => {
      // Invalidate the likes query for this specific blog post to refetch
      queryClient.invalidateQueries({ queryKey: ['likes', blogId] });
      // Optionally invalidate the main blog query if counts are displayed there
      // queryClient.invalidateQueries({ queryKey: ['blog', blogId] });
    },
    onError: (error, variables) => {
      // Error toast is handled globally by apiClient interceptor, 
      // but you could add specific logic here if needed.
      console.error("Like update failed:", error);
      // Add a specific toast for this error if desired
      const actionType = variables.type.toLowerCase();
      toast.error(`Failed to ${actionType} post: ${error.message || 'Unknown error'}`);
    },
  });
}; 