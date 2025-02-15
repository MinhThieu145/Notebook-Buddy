'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FiPlus, FiZap } from 'react-icons/fi';
import { getCanvas, updateCanvas, Block } from '../../utils/canvasStore';
import { TextBlock } from '../../components/TextBlock';
import { AIGenerateModal } from '../../components/AIGenerateModal';
import { debounce } from 'lodash';

interface TOCItem {
  level: number;
  text: string;
  id: number;
}

export default function CanvasPage() {
  // Authentication and routing hooks
  const { data: session, status } = useSession();
  const { id } = useParams();
  const router = useRouter();

  // State hooks
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Effect for authentication and canvas loading
  useEffect(() => {
    console.log('Canvas ID:', id);
    console.log('Auth Status:', status);
    console.log('Session:', session);
    console.log('User:', session?.user);

    if (!session) {
      console.log('No session found, redirecting to home');
      router.push('/');
      return;
    }

    const fetchCanvasAndBlocks = async () => {
      try {
        // First try to get from local storage
        const localCanvas = getCanvas(id as string);
        console.log('Local canvas data:', localCanvas);
        
        // Log the request details
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/projects/${session.user.id}`;
        console.log('Fetching canvas with:', {
          url: apiUrl,
          userId: session.user.id,
          canvasId: id,
          env: {
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
          }
        });
        
        // Fetch canvas from database
        const canvasResponse = await fetch(apiUrl);
        
        console.log('Canvas fetch response:', {
          status: canvasResponse.status,
          statusText: canvasResponse.statusText,
          headers: Object.fromEntries(canvasResponse.headers.entries())
        });
        
        if (!canvasResponse.ok) {
          const errorText = await canvasResponse.text();
          console.error('Error response from server (canvas):', {
            status: canvasResponse.status,
            statusText: canvasResponse.statusText,
            body: errorText
          });
          throw new Error(`Failed to fetch canvas: ${errorText}`);
        }

        const canvasData = await canvasResponse.json();
        console.log('Fetched canvas data:', canvasData);

        if (canvasData.status === 'success' && canvasData.data) {
          // Find the specific canvas
          const dbCanvas = canvasData.data.find((project: any) => project.projectId === id);
          console.log('Found canvas in response:', dbCanvas);
          
          if (dbCanvas) {
            setTitle(dbCanvas.title);

            // Fetch text blocks for this canvas
            const blocksUrl = `${process.env.NEXT_PUBLIC_API_URL}/text-blocks/${id}`;
            console.log('Fetching text blocks with:', {
              url: blocksUrl,
              canvasId: id
            });
            
            const blocksResponse = await fetch(blocksUrl);
            
            console.log('Blocks fetch response:', {
              status: blocksResponse.status,
              statusText: blocksResponse.statusText,
              headers: Object.fromEntries(blocksResponse.headers.entries())
            });
            
            if (blocksResponse.ok) {
              const blocksData = await blocksResponse.json();
              console.log('Fetched text blocks:', blocksData);

              if (blocksData.status === 'success' && blocksData.data?.blocks) {
                // Use blocks from database
                const dbBlocks = blocksData.data.blocks.map((block: any) => ({
                  id: parseInt(block.textBlockId),
                  content: block.content
                }));
                console.log('Transformed blocks:', dbBlocks);
                setBlocks(dbBlocks);
                return;
              } else {
                console.warn('Unexpected blocks data format:', blocksData);
              }
            } else {
              const errorText = await blocksResponse.text();
              console.error('Error response from server (blocks):', {
                status: blocksResponse.status,
                statusText: blocksResponse.statusText,
                body: errorText
              });
            }

            // If we have blocks in the project data, use those
            if (dbCanvas.blocks) {
              console.log('Using blocks from canvas data:', dbCanvas.blocks);
              setBlocks(dbCanvas.blocks);
              return;
            }
          } else {
            console.warn('Canvas not found in response:', {
              canvasId: id,
              availableProjects: canvasData.data.map((p: any) => p.projectId)
            });
          }
        } else {
          console.warn('Unexpected canvas data format:', canvasData);
        }

        // Fallback to local storage if database fetch fails or returns no data
        if (localCanvas) {
          console.log('Using local canvas data:', localCanvas);
          setBlocks(localCanvas.blocks);
          setTitle(localCanvas.title);
        } else {
          console.log('Canvas not found in local storage, redirecting to canvas list');
          router.push('/canvas');
        }
      } catch (error) {
        console.error('Error fetching canvas:', {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack
          } : error,
          session: session ? {
            ...session,
            user: session.user ? {
              id: session.user.id
              // Add other non-sensitive user fields if needed
            } : null
          } : null,
          canvasId: id
        });
        // Fallback to local storage
        const localCanvas = getCanvas(id as string);
        if (localCanvas) {
          console.log('Falling back to local canvas data:', localCanvas);
          setBlocks(localCanvas.blocks);
          setTitle(localCanvas.title);
        } else {
          console.log('Canvas not found in local storage, redirecting to canvas list');
          router.push('/canvas');
        }
      }
    };

    fetchCanvasAndBlocks();
  }, [id, session, status, router]);

  // Debounced function to save blocks to DynamoDB
  const debouncedSaveBlocks = useCallback(
    debounce(async (blocksToSave: Block[]) => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/text-blocks/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: id,
            blocks: blocksToSave.map(block => ({
              id: block.id.toString(),
              content: block.content
            }))
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save text blocks');
        }

        const data = await response.json();
        console.log('Saved text blocks:', data);
      } catch (error) {
        console.error('Error saving text blocks:', error);
      }
    }, 2000), // Save after 2 seconds of no changes
    [id, session?.user?.id]
  );

  // Clean up the debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSaveBlocks.cancel();
    };
  }, [debouncedSaveBlocks]);

  // Effect for TOC generation
  useEffect(() => {
    // Generate TOC items from blocks
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

  // Callback hooks
  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks((blocks) => {
      const newBlocks = [...blocks];
      const [movedBlock] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, movedBlock);
      updateCanvas(id as string, { blocks: newBlocks, editedAt: new Date().toISOString() });
      return newBlocks;
    });
  }, [id]);

  const addBlock = useCallback((index: number, content: string) => {
    const newBlock = {
      id: Date.now(),
      content: content
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  }, [blocks]);

  const deleteBlock = useCallback((blockId: number) => {
    setBlocks((blocks) => {
      const newBlocks = blocks.filter((block) => block.id !== blockId);
      updateCanvas(id as string, { blocks: newBlocks, editedAt: new Date().toISOString() });
      return newBlocks;
    });
  }, [id]);

  const updateBlock = useCallback((blockId: number, content: string) => {
    setBlocks((blocks) => {
      const newBlocks = blocks.map((block) =>
        block.id === blockId ? { ...block, content } : block
      );
      updateCanvas(id as string, { blocks: newBlocks, editedAt: new Date().toISOString() });
      
      // Queue the block for saving to DynamoDB
      const updatedBlock = newBlocks.find(block => block.id === blockId);
      if (updatedBlock) {
        debouncedSaveBlocks([updatedBlock]);
      }
      
      return newBlocks;
    });
  }, [id, debouncedSaveBlocks]);

  const handleAIGeneration = async (file: File | null, instructions: string) => {
    if (!file) return;

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    try {
      console.log('Starting file upload...');
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
      
      // Upload file directly to FastAPI backend
      const formData = new FormData();
      formData.append('file', file);
      console.log('File to upload:', file.name, file.type, file.size);
      
      // The upload endpoint is at /upload
      const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL}/upload`;
      console.log('Upload URL:', uploadUrl);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Upload response status:', uploadResponse.status);
      console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.detail || 'Failed to upload file');
        } catch {
          throw new Error(`Failed to upload file: ${errorText}`);
        }
      }
      
      const uploadData = await uploadResponse.json();
      console.log('Upload successful:', uploadData);
      const { filePath } = uploadData;

      // Generate text blocks
      console.log('Starting text block generation...');
      // The text-blocks endpoint is at /text-blocks/generate-text-blocks
      const generateUrl = `${process.env.NEXT_PUBLIC_API_URL}/text-blocks/generate-text-blocks`;
      console.log('Generate URL:', generateUrl);
      
      const generateResponse = await fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path: filePath }),
      });

      console.log('Generate response status:', generateResponse.status);
      console.log('Generate response headers:', Object.fromEntries(generateResponse.headers.entries()));
      
      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('Generate error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.detail || 'Failed to generate text blocks');
        } catch {
          throw new Error(`Failed to generate text blocks: ${errorText}`);
        }
      }

      const generateData = await generateResponse.json();
      console.log('Generation successful:', generateData);
      const { data } = generateData;

      // Add each generated block to the canvas
      const newBlocks = data.map((block: { content: string }) => ({
        id: Date.now() + Math.random(), // Ensure unique IDs
        content: block.content,
      }));

      console.log('Adding new blocks to canvas:', newBlocks);
      setBlocks((currentBlocks) => {
        const updatedBlocks = [...currentBlocks, ...newBlocks];
        updateCanvas(id as string, { blocks: updatedBlocks, editedAt: new Date().toISOString() });
        return updatedBlocks;
      });

    } catch (error) {
      console.error('Error in AI generation:', error);
      alert(error instanceof Error ? error.message : 'An error occurred during AI generation');
    }
  };

  const handleTitleEdit = async (newTitle: string) => {
    if (!session?.user?.id) return;
    
    try {
      const updatedCanvas = {
        id: id as string,
        title: newTitle,
        editedAt: new Date().toISOString(),
        blocks
      };

      // Update local state
      setTitle(newTitle);
      setIsEditingTitle(false);

      // Update in storage
      updateCanvas(id as string, updatedCanvas);

      // Update in DynamoDB through FastAPI backend
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
      // You might want to show an error message to the user here
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 h-screen sticky top-0 overflow-y-auto bg-gray-50">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
          <div className="space-y-2">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  document.getElementById(`block-${item.id}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`block w-full text-left px-2 py-1 rounded hover:bg-gray-200 transition-colors
                  ${item.level === 1 ? 'font-semibold' : ''}
                  ${item.level === 2 ? 'pl-4 text-sm' : ''}
                  ${item.level === 3 ? 'pl-6 text-sm' : ''}`}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => router.push('/canvas')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleTitleEdit(title)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTitleEdit(title);
                    }
                  }}
                  className="text-2xl font-bold px-2 py-1 border rounded"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-2xl font-bold cursor-pointer"
                  onDoubleClick={() => setIsEditingTitle(true)}
                >
                  {title}
                </h1>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <div key={block.id} id={`block-${block.id}`}>
                <TextBlock
                  {...block}
                  index={index}
                  moveBlock={moveBlock}
                  updateBlock={updateBlock}
                  deleteBlock={deleteBlock}
                  addBlock={addBlock}
                  isFirst={index === 0}
                  isLast={index === blocks.length - 1}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => addBlock(blocks.length, '')}
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-4 text-gray-500 transition-colors duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600"
            >
              <FiPlus className="mr-2" /> Add new block
            </button>
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-4 text-gray-500 transition-colors duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600"
            >
              <FiZap className="mr-2" /> Generate with AI
            </button>
          </div>

          <AIGenerateModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            onSubmit={handleAIGeneration}
          />
        </div>
      </div>
    </div>
  );
}
