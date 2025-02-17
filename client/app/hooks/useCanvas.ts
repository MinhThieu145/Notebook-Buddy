import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Block, getCanvas, updateCanvas } from '../utils/canvasStore';

interface TOCItem {
  level: number;
  text: string;
  id: number;
}

export const useCanvas = (canvasId: string) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState('');
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced function to save blocks to DynamoDB
  const debouncedSaveBlocks = useCallback(
    debounce(async (blocksToSave: Block[]) => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/text-blocks/${canvasId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(blocksToSave.map(block => ({
            id: block.id.toString(),
            content: block.content
          }))),
        });

        if (!response.ok) {
          throw new Error('Failed to save text blocks');
        }

        const data = await response.json();
        console.log('Saved text blocks:', data);
      } catch (error) {
        console.error('Error saving text blocks:', error);
        setError('Failed to save changes. Please try again.');
      }
    }, 2000),
    [canvasId, session?.user?.id]
  );

  // Load canvas data
  const loadCanvas = useCallback(async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch canvas from database
      const canvasResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${session.user.id}`);
      
      if (!canvasResponse.ok) {
        throw new Error('Failed to fetch canvas');
      }

      const canvasData = await canvasResponse.json();

      if (canvasData.status === 'success' && canvasData.data) {
        const dbCanvas = canvasData.data.find((project: any) => project.projectId === canvasId);
        
        if (dbCanvas) {
          setTitle(dbCanvas.title);

          // Fetch text blocks
          const blocksResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/text-blocks/${canvasId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (blocksResponse.ok) {
            const blocksData = await blocksResponse.json();
            console.log('Loaded blocks:', blocksData); // Debug log
            if (blocksData.data && blocksData.data.blocks) {
              setBlocks(blocksData.data.blocks.map((block: any) => ({
                id: block.id,
                content: block.content,
                position: block.position || { x: 0, y: 0 }
              })));
            }
          } else {
            console.error('Failed to load blocks:', await blocksResponse.text()); // Debug log
          }
        }
      }
    } catch (error) {
      console.error('Error loading canvas:', error);
      setError('Failed to load canvas. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, canvasId]); // Add proper dependencies

  // Block operations
  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks((blocks) => {
      const newBlocks = [...blocks];
      const [movedBlock] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, movedBlock);
      updateCanvas(canvasId, { blocks: newBlocks, editedAt: new Date().toISOString() });
      return newBlocks;
    });
  }, [canvasId]);

  const addBlock = useCallback((index: number, content: string) => {
    const newBlock = {
      id: Date.now(),
      content: content
    };
    setBlocks((blocks) => {
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
  }, []);

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
    if (!session?.user?.id) return;
    
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
          userId: session.user.id,
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

  // Effect for loading canvas data
  useEffect(() => {
    loadCanvas();
  }, [loadCanvas]);

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
