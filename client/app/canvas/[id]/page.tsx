'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FiPlus, FiZap } from 'react-icons/fi';
import { getCanvas, updateCanvas, Block } from '../../utils/canvasStore';
import { TextBlock } from '../../components/TextBlock';
import { AIGenerateModal } from '../../components/AIGenerateModal';

export default function CanvasPage() {
  const { id } = useParams();
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    const canvas = getCanvas(id as string);
    if (!canvas) {
      router.push('/');
    } else {
      setBlocks(canvas.blocks);
    }
  }, [id, router]);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks((blocks) => {
      const newBlocks = [...blocks];
      const [movedBlock] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, movedBlock);
      updateCanvas(id as string, { blocks: newBlocks, editedAt: new Date().toISOString() });
      return newBlocks;
    });
  }, [id]);

  const addBlock = useCallback(() => {
    const newBlock = { id: Date.now(), content: "New block" };
    setBlocks((blocks) => {
      const newBlocks = [...blocks, newBlock];
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
      return newBlocks;
    });
  }, [id]);

  const deleteBlock = useCallback((blockId: number) => {
    setBlocks((blocks) => {
      const newBlocks = blocks.filter((block) => block.id !== blockId);
      updateCanvas(id as string, { blocks: newBlocks, editedAt: new Date().toISOString() });
      return newBlocks;
    });
  }, [id]);

  const handleAIGeneration = async (file: File | null, instructions: string) => {
    if (!file) return;

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    try {
      // Upload file directly to FastAPI backend
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.detail || 'Failed to upload file');
      }
      
      const { filePath } = await uploadResponse.json();

      // Generate text blocks
      const generateResponse = await fetch('http://localhost:8000/api/generate-text-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path: filePath }),
      });

      if (!generateResponse.ok) {
        const error = await generateResponse.json();
        throw new Error(error.detail || 'Failed to generate text blocks');
      }

      const { data } = await generateResponse.json();

      // Add each generated block to the canvas
      const newBlocks = data.blocks.map((block: { title: string; content: string }) => ({
        id: Date.now() + Math.random(), // Ensure unique IDs
        content: `${block.title}\n\n${block.content}`,
      }));

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <TextBlock
              key={block.id}
              {...block}
              index={index}
              moveBlock={moveBlock}
              updateBlock={updateBlock}
              deleteBlock={deleteBlock}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
            />
          ))}
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={addBlock}
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
  );
}
