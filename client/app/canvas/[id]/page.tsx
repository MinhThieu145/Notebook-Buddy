'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FiPlus } from 'react-icons/fi';
import { getCanvas, updateCanvas, Block } from '../../utils/canvasStore';
import { TextBlock } from '../../components/TextBlock';

export default function CanvasPage() {
  const { id } = useParams();
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);

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
        <DndProvider backend={HTML5Backend}>
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <TextBlock
                key={block.id}
                {...block}
                index={index}
                moveBlock={moveBlock}
                updateBlock={updateBlock}
                deleteBlock={deleteBlock}
              />
            ))}
          </div>
        </DndProvider>
        
        <button
          onClick={addBlock}
          className="mt-6 flex w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-4 text-gray-500 transition-colors duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600"
        >
          <FiPlus className="mr-2" /> Add new block
        </button>
      </div>
    </div>
  );
}
