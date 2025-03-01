import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Canvas, getCanvases } from '@/app/utils/canvasStore';
import { Block, Project } from '@/types/canvas';

/**
 * A hook for fetching canvases from the API or local storage
 * 
 * @returns An object containing the canvases and a function to set canvases
 */
export function useCanvasFetch() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Log authentication status
    console.log('Auth Status:', isSignedIn);
    console.log('User:', user);

    if (!isSignedIn || !user) {
      console.log('No user found, redirecting to home');
      router.push('/');
      return;
    }

    const fetchCanvases = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Log the request details
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/projects/${user.id}`;
        console.log('Fetching canvases with:', {
          url: apiUrl,
          userId: user.id,
          env: {
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
          }
        });

        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response from server:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`Failed to fetch canvases: ${errorText}`);
        }

        const data = await response.json();
        console.log('Fetched canvases:', data);

        if (data.status === 'success' && data.data) {
          // Transform the projects into Canvas format
          const dbCanvases = data.data.map((project: Project) => ({
            id: project.projectId,  // Map projectId to id for local storage
            title: project.title,
            editedAt: project.editedAt,
            blocks: (project.blocks || []).map((block: Block, index: number) => ({
              ...block,
              order: index
            }))
          } as Canvas));  // Explicitly type as Canvas

          console.log('Transformed canvases:', dbCanvases);

          // Update both local storage and state
          localStorage.setItem('notebook-buddy-canvases', JSON.stringify(dbCanvases));
          setCanvases(dbCanvases);
        } else {
          console.warn('Unexpected data format:', data);
          throw new Error('Invalid data format received from server');
        }
      } catch (error) {
        console.error('Error fetching canvases:', {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack
          } : error,
          user: user ? {
            id: user.id
            // Add other non-sensitive user fields if needed
          } : null
        });
        
        // Set error state
        setError(error instanceof Error ? error : new Error('Unknown error fetching canvases'));
        
        // Fallback to local storage if database fetch fails
        setCanvases(getCanvases());
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanvases();
  }, [isSignedIn, user, router]);

  return { canvases, setCanvases, isLoading, error };
}

export default useCanvasFetch;
