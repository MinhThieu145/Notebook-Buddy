import { useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Canvas, ProjectResponse, addCanvas } from '@/app/utils/canvasStore';

/**
 * A hook for canvas operations such as creating and deleting canvases
 * 
 * @param setCanvases - Function to update the canvases state
 * @returns An object containing functions for canvas operations
 */
export function useCanvasOperations(
  setCanvases: React.Dispatch<React.SetStateAction<Canvas[]>>
) {
  const { user } = useUser();

  /**
   * Create a new canvas
   */
  const createCanvas = useCallback(async () => {
    try {
      if (!user?.id) {
        console.error('No user found');
        return;
      }

      const newCanvas = {
        id: crypto.randomUUID(),  // Use UUID instead of timestamp
        title: 'Untitled',
        editedAt: new Date().toISOString(),
        blocks: [{ 
          id: crypto.randomUUID(),  // Use UUID for blocks too
          content: "Start writing your document here...",
          order: 0
        }]
      } as Canvas;  // Explicitly type as Canvas

      console.log('New canvas data:', {
        id: newCanvas.id,
        title: newCanvas.title,
        editedAt: newCanvas.editedAt,
        blocks: newCanvas.blocks
      });

      const requestBody = {
        userId: user.id,
        canvas: newCanvas
      };
      
      console.log('Creating new canvas with data:', JSON.stringify(requestBody, null, 2));
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

      // Fetch updated canvas list from database
      const canvasResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${user.id}`);
      
      if (canvasResponse.ok) {
        const data = await canvasResponse.json();
        if (data.status === 'success' && data.data) {
          // Transform the projects into Canvas format
          const dbCanvases = data.data.map((project: any) => ({
            id: project.projectId,  // Map projectId to id for local storage
            title: project.title,
            editedAt: project.editedAt,
            blocks: (project.blocks || []).map((block: any, index: number) => ({
              ...block,
              order: index
            }))
          } as Canvas));  // Explicitly type as Canvas

          // Update both local storage and state
          localStorage.setItem('notebook-buddy-canvases', JSON.stringify(dbCanvases));
          setCanvases(dbCanvases);
        }
      } else {
        // Fallback to local update if fetch fails
        const updatedCanvases = addCanvas(newCanvas);
        setCanvases(updatedCanvases);
      }

    } catch (error) {
      console.error('Error creating new canvas:', error);
      console.error('Error details:', {
        user: user ? { 
          id: user.id,
          // Add other user fields but omit sensitive data
        } : null,
        env: {
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
        }
      });
    }
  }, [user, setCanvases]);

  /**
   * Delete a canvas
   * 
   * @param canvasId - ID of the canvas to delete
   * @param onSuccess - Optional callback to execute on successful deletion
   */
  const deleteCanvas = useCallback(async (canvasId: string, onSuccess?: () => void) => {
    if (!user?.id) {
      console.error('No user found');
      return;
    }

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/projects/${canvasId}`;
      console.log('Deleting canvas:', {
        canvasId,
        userId: user.id,
        apiUrl
      });

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'X-User-ID': user.id,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete canvas error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          canvasId,
          userId: user.id
        });
        throw new Error(`Failed to delete canvas: ${errorText}`);
      }

      console.log('Canvas deleted successfully:', canvasId);
      
      // Update local state
      setCanvases(prevCanvases => prevCanvases.filter(canvas => canvas.id !== canvasId));
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error in deleteCanvas:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        canvasId,
        userId: user.id,
        apiUrl: `${process.env.NEXT_PUBLIC_API_URL}/projects/${canvasId}`
      });
    }
  }, [user, setCanvases]);

  return { createCanvas, deleteCanvas };
}

export default useCanvasOperations;