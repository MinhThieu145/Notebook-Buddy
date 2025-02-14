'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Canvas, ProjectResponse, getCanvases, addCanvas } from '../utils/canvasStore';

export default function CanvasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Log authentication status
    console.log('Auth Status:', status);
    console.log('Session:', session);

    if (!session) {
      console.log('No session found, redirecting to home');
      router.push('/');
      return;
    }

    setCanvases(getCanvases());
  }, [session, status, router]);

  // Return null while checking authentication
  if (!session) {
    console.log('Rendering null - no session');
    return null;
  }

  const createNewCanvas = async () => {
    try {
      if (!session?.user?.id) {
        console.error('No user session found');
        return;
      }

      const newCanvas = {
        id: `canvas-${Date.now()}`,
        title: 'Untitled',
        editedAt: new Date().toISOString(),
        blocks: [{ id: Date.now(), content: "Start writing your document here..." }]
      };

      const requestBody = {
        userId: session.user.id,
        canvas: newCanvas
      };
      
      console.log('Creating new canvas with data:', requestBody);
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/projects/create`;
      console.log('API URL:', apiUrl);

      // Save to backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to save project: ${responseText}`);
      }

      const projectData: ProjectResponse = JSON.parse(responseText);
      console.log('Project created successfully:', projectData);

      // Update local state
      const updatedCanvases = addCanvas(newCanvas);
      setCanvases(updatedCanvases);

    } catch (error) {
      console.error('Error creating new canvas:', error);
      console.error('Error details:', {
        session: session ? { 
          ...session, 
          user: session.user ? {
            id: session.user.id,
            // Add other user fields but omit sensitive data
          } : null 
        } : null,
        env: {
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
        }
      });
    }
  };

  const filteredCanvases = canvases.filter(canvas => 
    canvas.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {filteredCanvases.length > 0 && (
          <div className="mt-8">
            <h2 className="text-gray-700 text-sm font-medium mb-3">Recently viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredCanvases.map((canvas) => (
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
