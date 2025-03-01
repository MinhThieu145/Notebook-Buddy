import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { debounce } from 'lodash';
import { Block, Project, BlockData } from '@/types/canvas';
import { updateCanvas } from '@/app/utils/canvasStore';

interface TOCItem {
  level: number;
  text: string;
  id: string;
}

export const useCanvasTextBlocks = (canvasId: string) => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
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

  // Create a stable debounced save function
  const debouncedSave = useRef(
    debounce(async (blocksToSave: Block[], userId: string, canvasId: string) => {
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
    }, 2000)
  ).current;

  // Memoized function that uses the debounced save
  const debouncedSaveBlocks = useCallback((blocksToSave: Block[]) => {
    if (!user?.id) return;
    debouncedSave(blocksToSave, user.id, canvasId);
  }, [user?.id, canvasId, debouncedSave]);

  // Load canvas data
  const loadCanvas = useCallback(async () => {
    if (!isSignedIn || !user?.id) {
      console.log('Not signed in or no user ID');
      return;
    }

    console.log('Starting loadCanvas:', { isSignedIn, userId: user?.id, canvasId });
    
    if (!isMounted.current) {
      console.log('Component not mounted during loadCanvas start');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/projects/${user.id}`;
      console.log('Fetching canvas data from:', url);

      const response = await fetch(url);
      console.log('Canvas response received:', { status: response.status });

      if (!isMounted.current) {
        console.log('Component unmounted after canvas response');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load canvas');
      }

      const canvasData = await response.json();
      console.log('Canvas data received:', canvasData);

      if (!isMounted.current) {
        console.log('Component unmounted after parsing canvas data');
        return;
      }

      if (canvasData.status === 'success' && Array.isArray(canvasData.data)) {
        const dbCanvas = canvasData.data.find((project: Project) => project.projectId === canvasId);
        console.log('Found canvas:', dbCanvas);
        
        if (dbCanvas) {
          if (isMounted.current) {
            setTitle(dbCanvas.title || 'Untitled Canvas');
          }
          
          // Now fetch text blocks
          const textBlocksUrl = `${process.env.NEXT_PUBLIC_API_URL}/text-blocks/${canvasId}`;
          console.log('Fetching text blocks from:', textBlocksUrl);

          const blocksResponse = await fetch(textBlocksUrl);
          console.log('Text blocks response received:', { 
            status: blocksResponse.status,
            ok: blocksResponse.ok,
            statusText: blocksResponse.statusText 
          });
          
          if (!isMounted.current) {
            console.log('Component unmounted after blocks response');
            return;
          }
          
          if (!blocksResponse.ok) {
            throw new Error('Failed to load blocks');
          }

          const blocksData = await blocksResponse.json();
          console.log('Text blocks data received:', JSON.stringify(blocksData, null, 2));

          if (!isMounted.current) {
            console.log('Component unmounted after parsing blocks data');
            return;
          }

          if (blocksData.status === 'success' && blocksData.data && Array.isArray(blocksData.data.blocks)) {
            const transformedBlocks = blocksData.data.blocks.map((block: BlockData) => {
              console.log('Transforming block:', block);
              return {
                id: block.id || block.textBlockId || generateUniqueId(),
                content: block.content || '',
                position: block.position || { x: 0, y: 0 },
                order: typeof block.order === 'number' ? block.order : 0
              };
            });
            console.log('Setting blocks:', transformedBlocks);
            if (isMounted.current) {
              setBlocks(transformedBlocks);
            }
          } else {
            console.log('No blocks found or invalid format:', blocksData);
            if (isMounted.current) {
              setBlocks([]);
            }
          }
        } else {
          console.log('Canvas not found:', { canvasId, availableCanvases: canvasData.data });
          throw new Error(`Canvas not found with ID: ${canvasId}`);
        }
      } else {
        console.log('Invalid response format:', canvasData);
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
  }, [loadCanvas, isSignedIn, canvasId, user?.id]);

  // Verify environment variable
  useEffect(() => {
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
  }, []);

  // Helper function to generate unique ID
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Block operations
  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
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

  const addBlock = useCallback((positionOrId?: number | string, predefinedId?: string) => {
    // If first parameter is a string, it's a predefinedId
    const position = typeof positionOrId === 'number' ? positionOrId : undefined;
    const blockId = typeof positionOrId === 'string' ? positionOrId : predefinedId;

    const newBlock: Block = {
      id: blockId || generateUniqueId(),
      content: '',
      order: typeof position === 'number' ? position : blocks.length
    };
    
    // Update local state first
    setBlocks(prevBlocks => {
      let newBlocks;
      if (typeof position === 'number') {
        // Insert at specific position
        newBlocks = [
          ...prevBlocks.slice(0, position),
          newBlock,
          ...prevBlocks.slice(position)
        ];
        // Update order of all blocks
        newBlocks = newBlocks.map((block, index) => ({
          ...block,
          order: index
        }));
      } else {
        // Add to end
        newBlocks = [...prevBlocks, newBlock];
      }
      
      // Update local storage
      updateCanvas(canvasId, { blocks: newBlocks, editedAt: new Date().toISOString() });
      
      // Save to DynamoDB
      debouncedSaveBlocks(newBlocks);
      
      return newBlocks;
    });
  }, [blocks, canvasId, debouncedSaveBlocks]);

  const deleteBlock = useCallback(async (blockId: string) => {
    try {
      // First update local state
      setBlocks((prevBlocks) => {
        const newBlocks = prevBlocks.filter((block) => block.id !== blockId)
          .map((block, index) => ({
            ...block,
            order: index // Update order of remaining blocks
          }));
        
        // Update local storage
        updateCanvas(canvasId, { blocks: newBlocks, editedAt: new Date().toISOString() });
        
        return newBlocks;
      });

      // Then delete from database
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/text-blocks/${canvasId}/${blockId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete block from database');
      }

      // Save the updated blocks list to ensure order is preserved
      debouncedSaveBlocks(blocks.filter(block => block.id !== blockId));
      
    } catch (error) {
      console.error('Error deleting block:', error);
      setError('Failed to delete block. Please try again.');
      
      // Optionally revert the local state if the server delete failed
      loadCanvas();
    }
  }, [canvasId, blocks, debouncedSaveBlocks, loadCanvas]);

  const updateBlock = useCallback((blockId: string, content: string) => {
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
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

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
