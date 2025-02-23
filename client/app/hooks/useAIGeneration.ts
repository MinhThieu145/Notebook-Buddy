import { useState } from 'react';

interface UseAIGenerationProps {
  onSuccess: (newBlocks: Array<{ id: string; content: string }>) => void;
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
      // Upload file and generate text blocks in one request
      const formData = new FormData();
      formData.append('file', file);
      if (instructions) {
        formData.append('instructions', instructions);
      }
      
      const generateResponse = await fetch('https://notecrafts.app.n8n.cloud/webhook/test-webhook', {
        method: 'POST',
        body: formData,
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

      const data = await generateResponse.json();
      
      // Ensure we have valid data
      if (!data || !Array.isArray(data) || !data[0]?.output) {
        throw new Error('Invalid response format from API');
      }

      // Helper function to generate unique ID
      const generateUniqueId = () => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      };

      // Helper function to add a block with guaranteed unique ID
      const addBlock = (content: string) => {
        newBlocks.push({
          id: generateUniqueId(),
          content: content.trim(),
        });
      };

      interface Block {
        id: string;
        content: string;
      }

      const newBlocks: Block[] = [];

      // Split the markdown into lines and process
      const lines = data[0].output.split('\n').filter((line: string) => line.trim());
      let currentBlock: string[] = [];
      let currentLevel = 0; // 0 = no header, 1 = #, 2 = ##, 3 = ###

      const finishCurrentBlock = () => {
        if (currentBlock.length > 0) {
          addBlock(currentBlock.join('\n'));
          currentBlock = [];
        }
      };

      lines.forEach((line: string) => {
        const trimmedLine = line.trim();
        
        // Check if it's a header
        if (trimmedLine.startsWith('#')) {
          const headerLevel = trimmedLine.split(' ')[0].length; // Count #'s
          
          // Only create new blocks for headers level 1-3
          if (headerLevel <= 3) {
            finishCurrentBlock();
            currentBlock = [trimmedLine];
            currentLevel = headerLevel;
          } else {
            // For lower level headers, add to current block
            currentBlock.push(trimmedLine);
          }
        } else {
          // For non-header content
          if (currentLevel === 0) {
            // If no header context, create a new block
            finishCurrentBlock();
            currentBlock = [trimmedLine];
          } else {
            // Add to current header's block
            currentBlock.push(trimmedLine);
          }
        }
      });

      // Add any remaining content
      finishCurrentBlock();

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
