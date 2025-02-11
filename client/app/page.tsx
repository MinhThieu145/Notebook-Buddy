'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Canvas, getCanvases, addCanvas } from './utils/canvasStore';

export default function Home() {
  const [canvases, setCanvases] = useState<Canvas[]>([]);

  useEffect(() => {
    setCanvases(getCanvases());
  }, []);

  const createNewCanvas = () => {
    const newCanvas = {
      id: `canvas-${Date.now()}`,
      title: 'Untitled',
      editedAt: new Date().toISOString(),
      blocks: [{ id: Date.now(), content: "Start writing your document here..." }]
    };
    const updatedCanvases = addCanvas(newCanvas);
    setCanvases(updatedCanvases);
  };

  return (
    <div className="min-h-screen bg-white">
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
          onClick={createNewCanvas}
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
        {canvases.length > 0 && (
          <div className="mt-8">
            <h2 className="text-gray-700 text-sm font-medium mb-3">Recently viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {canvases.map((canvas) => (
                <Link
                  key={canvas.id}
                  href={`/canvas/${canvas.id}`}
                  className="block group"
                >
                  <div className="aspect-[3/4] rounded-lg border border-gray-200 hover:border-blue-300 p-3 hover:shadow-sm transition-all duration-200">
                    <h3 className="font-medium text-sm text-gray-900">{canvas.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Edited {new Date(canvas.editedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
