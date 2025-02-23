'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FiPlus, FiZap } from 'react-icons/fi';
import { TextBlock } from '../../components/TextBlock';
import { AIGenerateModal } from '../../components/AIGenerateModal';
import { useCanvas } from '../../hooks/useCanvas';
import { useAIGeneration } from '../../hooks/useAIGeneration';

export default function CanvasPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { id } = useParams();
  const router = useRouter();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const {
    blocks,
    title,
    tocItems,
    isLoading,
    error: canvasError,
    moveBlock,
    addBlock,
    deleteBlock,
    updateBlock,
    updateTitle,
  } = useCanvas(id as string);

  const {
    generateBlocks,
    isLoading: isGenerating,
    error: generationError,
    clearError: clearGenerationError,
  } = useAIGeneration({
    onSuccess: (newBlocks) => {
      // Create blocks with the generated IDs
      newBlocks.forEach((newBlock) => {
        addBlock(newBlock.id); // Pass the generated ID to addBlock
      });
      
      // Update their content
      newBlocks.forEach((newBlock) => {
        updateBlock(newBlock.id, newBlock.content);
      });
      
      setIsAIModalOpen(false);
    },
  });

  const handleAIGeneration = async (file: File | null, instructions: string) => {
    if (!file) return;
    await generateBlocks(file, instructions);
  };

  const handleTitleEdit = async (newTitle: string) => {
    await updateTitle(newTitle);
    setIsEditingTitle(false);
  };

  useEffect(() => {
    console.log('Auth effect running:', { isSignedIn, user });
    if (!isSignedIn || !user) {
      console.log('Redirecting to sign-in...');
      router.push('/sign-in');
    } else {
      console.log('Setting authChecked to true');
      setAuthChecked(true);
    }
  }, [isSignedIn, user, router]);

  console.log('Component render state:', { authChecked, isLoading, blocks, error: canvasError });

  if (!authChecked) {
    console.log('Rendering auth check loading state');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    console.log('Rendering canvas loading state');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading canvas...</p>
        </div>
      </div>
    );
  }

  if (canvasError || generationError) {
    console.log('Rendering error state:', { canvasError, generationError });
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{canvasError || generationError}</p>
          <button
            onClick={() => {
              clearGenerationError();
              router.refresh();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
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
                  onChange={(e) => updateTitle(e.target.value)}
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
              onClick={() => addBlock()}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiPlus className="mr-2" /> Add Block
            </button>
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-4 text-gray-500 transition-colors duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <div key="generating" className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  Generating...
                </div>
              ) : (
                <div key="generate" className="flex items-center">
                  <FiZap className="mr-2" /> Generate with AI
                </div>
              )}
            </button>
          </div>

          <AIGenerateModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            onSubmit={handleAIGeneration}
            isLoading={isGenerating}
            error={generationError}
          />
        </div>
      </div>
    </div>
  );
}
