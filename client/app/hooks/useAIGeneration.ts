import { useState } from 'react';

interface UseAIGenerationProps {
  onSuccess: (newBlocks: Array<{ id: number; content: string }>) => void;
}

export const useAIGeneration = ({ onSuccess }: UseAIGenerationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBlocks = async (file: File, instructions: string) => {
    if (!file) return;

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.detail || 'Failed to upload file');
        } catch {
          throw new Error(`Failed to upload file: ${errorText}`);
        }
      }
      
      const uploadData = await uploadResponse.json();
      const { filePath } = uploadData;

      // Generate text blocks
      const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/text-blocks/generate-text-blocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          file_path: filePath,
          instructions: instructions
        }),
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.detail || 'Failed to generate text blocks');
        } catch {
          throw new Error(`Failed to generate text blocks: ${errorText}`);
        }
      }

      const generateData = await generateResponse.json();
      const { data } = generateData;

      // Create new blocks with unique IDs
      const newBlocks = data.map((block: { content: string }) => ({
        id: Date.now() + Math.random(),
        content: block.content,
      }));

      onSuccess(newBlocks);
    } catch (error) {
      console.error('Error in AI generation:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during AI generation');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateBlocks,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};
