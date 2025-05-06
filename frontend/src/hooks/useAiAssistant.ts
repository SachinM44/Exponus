import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import apiClient from '../lib/apiClient';

// Type for AI assistant request
type AiAssistantRequest = {
  prompt: string;
  promptType?: 'topic' | 'outline' | 'paragraph' | 'custom';
};

// Type for AI assistant response
type AiAssistantResponse = {
  content: string;
};

// Hook for using the AI assistant
export const useAiAssistant = () => {
  return useMutation<AiAssistantResponse, Error, AiAssistantRequest>({
    mutationFn: async (data: AiAssistantRequest) => {
      const response = await apiClient.post<AiAssistantResponse>('/api/v1/blog/ai-assistant', data);
      return response.data;
    },
    onError: (error) => {
      console.error('AI assistant error:', error);
      toast.error('Failed to generate content. Please try again.');
    },
  });
};
