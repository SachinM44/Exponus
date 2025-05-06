import { useState } from 'react';
import { useAiAssistant } from '../hooks/useAiAssistant';

type AiBlogAssistantProps = {
  onContentGenerated: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

export const AiBlogAssistant = ({ onContentGenerated, isOpen, onClose }: AiBlogAssistantProps) => {
  const [prompt, setPrompt] = useState('');
  const [promptType, setPromptType] = useState<'topic' | 'outline' | 'paragraph' | 'custom'>('topic');
  const aiAssistantMutation = useAiAssistant();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    try {
      // Send just the topic, not the full prompt
      const result = await aiAssistantMutation.mutateAsync({ 
        prompt: prompt.trim(),
        promptType: promptType 
      });
      
      if (result.content) {
        onContentGenerated(result.content);
        onClose();
      }
    } catch (error) {
      console.error('Error generating content:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Blog Assistant</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What would you like help with?
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => setPromptType('topic')}
              className={`px-3 py-2 text-sm rounded-md ${promptType === 'topic' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
            >
              Introduction
            </button>
            <button
              type="button"
              onClick={() => setPromptType('outline')}
              className={`px-3 py-2 text-sm rounded-md ${promptType === 'outline' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
            >
              Outline
            </button>
            <button
              type="button"
              onClick={() => setPromptType('paragraph')}
              className={`px-3 py-2 text-sm rounded-md ${promptType === 'paragraph' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
            >
              Paragraph
            </button>
            <button
              type="button"
              onClick={() => setPromptType('custom')}
              className={`px-3 py-2 text-sm rounded-md ${promptType === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {promptType === 'topic' && 'Enter a topic (e.g., "Artificial Intelligence")'}
            {promptType === 'outline' && 'Enter a subject for your outline (e.g., "Remote Work")'}
            {promptType === 'paragraph' && 'Enter a specific topic (e.g., "Benefits of Meditation")'}
            {promptType === 'custom' && 'Enter your custom prompt'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            rows={4}
            placeholder={promptType === 'custom' ? 'Write a detailed paragraph about the future of blockchain technology...' : 'Enter your topic here...'}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim() || aiAssistantMutation.isPending}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            {aiAssistantMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Content'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
