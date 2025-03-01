'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Canvas, getCanvases, addCanvas, ProjectResponse } from '@/app/utils/canvasStore';
import { Block, Project } from '@/types/canvas';
import { ConfirmDialog } from '@/app/components/common/ConfirmDialog';
import { CanvasMenu } from '@/app/components/canvasHomePage/CanvasMenu';
import { useClickOutside } from '@/app/hooks/common';
import { useCanvasFetch, useCanvasOperations } from '@/app/hooks/canvasHomePage';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CanvasPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [canvasToDelete, setCanvasToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Use our custom hooks
  const { canvases, setCanvases, isLoading } = useCanvasFetch();
  const { createCanvas, deleteCanvas } = useCanvasOperations(setCanvases);
  
  // Use our click outside hook
  useClickOutside(menuRef, () => setMenuOpen(null), !!menuOpen);

  // Return null while checking authentication
  if (!isSignedIn || !user) {
    console.log('Rendering null - no authentication');
    return null;
  }

  const handleDeleteClick = (canvasId: string) => {
    setCanvasToDelete(canvasId);
    setConfirmOpen(true);
    setMenuOpen(null);
  };

  const confirmDelete = () => {
    if (canvasToDelete) {
      deleteCanvas(canvasToDelete, () => {
        setConfirmOpen(false);
        setCanvasToDelete(null);
      });
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setCanvasToDelete(null);
  };

  const handleMoveToFolder = () => {
    console.log('Move to folder clicked');
    // Implement folder functionality
    setMenuOpen(null);
  };

  const filteredCanvases = canvases.filter(canvas => 
    canvas.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Canvas"
        message="Are you sure you want to delete this canvas? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Search Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center">
            <div className="relative flex-grow max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a canvas..."
                className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Start New Doc Button */}
        <button
          onClick={createCanvas}
          className="w-40 h-48 rounded-lg border border-gray-200 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 p-4 text-left text-white hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center space-x-2">
            <PlusIcon className="h-6 w-6" />
            <div>
              <div className="font-medium text-base">Start new doc</div>
              <div className="text-xs opacity-80">New Canvas Doc</div>
            </div>
          </div>
        </button>

        {/* Recently viewed section */}
        {filteredCanvases.length > 0 && (
          <div className="mt-8">
            <h2 className="text-gray-700 text-sm font-medium mb-3">Recently viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredCanvases.map((canvas) => (
                <div 
                  key={canvas.id}
                  className="relative"
                >
                  <Link href={`/canvas/${canvas.id}`}>
                    <div className="group rounded-lg border p-4 transition-colors hover:border-gray-300">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-lg">{canvas.title}</h2>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setMenuOpen(menuOpen === canvas.id ? null : canvas.id);
                          }}
                          className="rounded p-2 hover:bg-gray-100"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Last edited {new Date(canvas.editedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <CanvasMenu
                    isOpen={menuOpen === canvas.id}
                    canvasId={canvas.id}
                    onDelete={() => handleDeleteClick(canvas.id)}
                    onMoveToFolder={handleMoveToFolder}
                    menuRef={menuRef}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
