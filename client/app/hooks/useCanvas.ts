import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Block, getCanvas, updateCanvas } from '../utils/canvasStore';

interface TOCItem {
  level: number;
  text: string;
  id: number;
}

export const useCanvas = (canvasId: string) => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState('');
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Set up the mounted ref
  useEffect(() => {
    isMounted.current = true;
    console.log('Component mounted');
    return () => {
      console.log('Component will unmount');
      isMounted.current = false;
    };
  }, []);

  // Debounced function to save blocks to DynamoDB
  const debouncedSaveBlocks = useCallback(
    debounce(async (blocksToSave: Block[]) => {
      if (!user?.id) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/text-blocks/${canvasId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ blocks: blocksToSave }),
        });

        if (!response.ok) {
          throw new Error('Failed to save changes');
        }

        const data = await response.json();
        console.log('Saved blocks:', data);
      } catch (error) {
        console.error('Error saving blocks:', error);
        setError('Failed to save changes. Please try again.');
      }
    }, 2000),
    [canvasId, user?.id]
  );

  // Load canvas data
  const loadCanvas = useCallback(async () => {
    if (!isSignedIn || !user?.id) {
      console.log('Not loading canvas - user not signed in:', { isSignedIn, userId: user?.id });
      return;
    }
    
    console.log('Starting to load canvas data for ID:', canvasId);
    setIsLoading(true);
    setError(null);

    try {
      // First get the canvas metadata to ensure we have a valid project
      const projectsUrl = `${process.env.NEXT_PUBLIC_API_URL}/projects/${user.id}`;
      console.log('Fetching canvas metadata from:', projectsUrl);

      const canvasResponse = await fetch(projectsUrl);
      console.log('Canvas response received:', { status: canvasResponse.status });
      
      if (!isMounted.current) {
        console.log('Component unmounted after canvas response');
        return;
      }
      
      if (!canvasResponse.ok) {
        throw new Error('Failed to fetch canvas metadata');
      }

      const canvasData = await canvasResponse.json();
      console.log('Canvas data received:', canvasData);

      if (!isMounted.current) {
        console.log('Component unmounted after parsing canvas data');
        return;
      }

      if (canvasData.status === 'success' && canvasData.data) {
        const dbCanvas = canvasData.data.find((project: any) => project.projectId === canvasId);
        console.log('Found canvas:', dbCanvas);
        
        if (dbCanvas) {
          if (isMounted.current) {
            setTitle(dbCanvas.title);
          }
          
          // Now fetch text blocks
          const textBlocksUrl = `${process.env.NEXT_PUBLIC_API_URL}/text-blocks/${canvasId}`;
          console.log('Fetching text blocks from:', textBlocksUrl);

          const blocksResponse = await fetch(textBlocksUrl);
          console.log('Text blocks response received:', { status: blocksResponse.status });
          
          if (!isMounted.current) {
            console.log('Component unmounted after blocks response');
            return;
          }
          
          if (!blocksResponse.ok) {
            throw new Error('Failed to load blocks');
          }

          const blocksData = await blocksResponse.json();
          console.log('Text blocks data received:', blocksData);

          if (!isMounted.current) {
            console.log('Component unmounted after parsing blocks data');
            return;
          }

          if (blocksData.status === 'success' && blocksData.data && blocksData.data.blocks) {
            const transformedBlocks = blocksData.data.blocks.map((block: any) => ({
              id: block.id || block.textBlockId,
              content: block.content,
              position: block.position || { x: 0, y: 0 },
              order: block.order || 0
            }));
            console.log('Setting blocks:', transformedBlocks);
            if (isMounted.current) {
              setBlocks(transformedBlocks);
            }
          } else {
            console.log('No blocks found, initializing empty array');
            if (isMounted.current) {
              setBlocks([]);
            }
          }
        } else {
          console.log('Canvas not found:', { canvasId, availableCanvases: canvasData.data });
          throw new Error(`Canvas not found with ID: ${canvasId}`);
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error loading canvas:', error);
      if (isMounted.current) {
        setError(error instanceof Error ? error.message : 'Failed to load canvas. Please try again.');
      }
    } finally {
      console.log('Finishing load canvas, mounted:', isMounted.current);
      if (isMounted.current) {
        console.log('Setting loading to false');
        setIsLoading(false);
      }
    }
  }, [isSignedIn, user?.id, canvasId]);

  // Load canvas data on mount and when dependencies change
  useEffect(() => {
    console.log('useCanvas effect triggered:', { isSignedIn, userId: user?.id, canvasId });
    if (isMounted.current) {
      loadCanvas();
    }
  }, [loadCanvas]);

  // Verify environment variable
  useEffect(() => {
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
  }, []);

  // Block operations
  const moveBlock = useCallback((blockId: number, direction: 'up' | 'down') => {
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      const index = newBlocks.findIndex((block) => block.id === blockId);
      if (index === -1) return prevBlocks;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newBlocks.length) return prevBlocks;

      // Swap blocks and their orders
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[targetIndex];
      newBlocks[targetIndex] = temp;

      // Update order values
      newBlocks.forEach((block, idx) => {
        block.order = idx;
      });

      // Save the updated blocks
      updateCanvas(canvasId, { blocks: newBlocks, editedAt: new Date().toISOString() });
      debouncedSaveBlocks(newBlocks);

      return newBlocks;
    });
  }, [canvasId, debouncedSaveBlocks]);

  const addBlock = useCallback(() => {
    setBlocks((prevBlocks) => {
      const newBlock: Block = {
        id: Date.now(),
        content: '',
        order: prevBlocks.length // New blocks are added at the end
      };
      const newBlocks = [...prevBlocks, newBlock];
      updateCanvas(canvasId, { blocks: newBlocks, editedAt: new Date().toISOString() });
      debouncedSaveBlocks([newBlock]); // Save only the new block
      return newBlocks;
    });
  }, [canvasId, debouncedSaveBlocks]);

  const deleteBlock = useCallback((blockId: number) => {
    setBlocks((blocks) => {
      const newBlocks = blocks.filter((block) => block.id !== blockId);
      updateCanvas(canvasId, { blocks: newBlocks, editedAt: new Date().toISOString() });
      return newBlocks;
    });
  }, [canvasId]);

  const updateBlock = useCallback((blockId: number, content: string) => {
    setBlocks((blocks) => {
      const newBlocks = blocks.map((block) =>
        block.id === blockId ? { ...block, content } : block
      );
      updateCanvas(canvasId, { blocks: newBlocks, editedAt: new Date().toISOString() });
      
      // Queue the block for saving to DynamoDB
      const updatedBlock = newBlocks.find(block => block.id === blockId);
      if (updatedBlock) {
        debouncedSaveBlocks([updatedBlock]);
      }
      
      return newBlocks;
    });
  }, [canvasId, debouncedSaveBlocks]);

  // Title operations
  const updateTitle = async (newTitle: string) => {
    if (!user?.id) return;
    
    try {
      const updatedCanvas = {
        id: canvasId,
        title: newTitle,
        editedAt: new Date().toISOString(),
        blocks
      };

      // Update local state
      setTitle(newTitle);

      // Update in storage
      updateCanvas(canvasId, updatedCanvas);

      // Update in DynamoDB
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          canvas: updatedCanvas
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update canvas');
      }
    } catch (error) {
      console.error('Error updating canvas title:', error);
      setError('Failed to update title. Please try again.');
    }
  };

  // Effect for TOC generation
  useEffect(() => {
    const items: TOCItem[] = [];
    blocks.forEach((block) => {
      const firstLine = block.content.split('\n')[0];
      if (firstLine.startsWith('#')) {
        const level = (firstLine.match(/^#+/) || [''])[0].length;
        const text = firstLine.replace(/^#+\s*/, '');
        items.push({ level, text, id: block.id });
      }
    });
    setTocItems(items);
  }, [blocks]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      debouncedSaveBlocks.cancel();
    };
  }, [debouncedSaveBlocks]);

  return {
    blocks,
    title,
    tocItems,
    isLoading,
    error,
    moveBlock,
    addBlock,
    deleteBlock,
    updateBlock,
    updateTitle,
  };
};
