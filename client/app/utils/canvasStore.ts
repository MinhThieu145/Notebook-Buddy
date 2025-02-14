export interface Block {
  id: number;
  content: string;
}

export interface Canvas {
  id: string;
  title: string;
  editedAt: string;
  blocks: Array<{ id: number; content: string }>;
}

export interface ProjectResponse {
  status: string;
  data: {
    project: Canvas & {
      projectId: string;
      userId: string;
      assistantId: string;
      metadata: {
        assistantName: string;
        lastModified: string;
      };
    };
    assistant: any; // We'll type this more specifically if needed
  };
}

// For now, we'll use localStorage to store canvases
const STORAGE_KEY = 'notebook-buddy-canvases';

export const getCanvases = (): Canvas[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getCanvas = (id: string): Canvas | undefined => {
  const canvases = getCanvases();
  return canvases.find(canvas => canvas.id === id);
};

export const addCanvas = (canvas: Canvas): Canvas[] => {
  const canvases = getCanvases();
  const updatedCanvases = [canvas, ...canvases];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCanvases));
  return updatedCanvases;
};

export const updateCanvas = (id: string, updates: Partial<Canvas>): Canvas[] => {
  const canvases = getCanvases();
  const updatedCanvases = canvases.map(canvas => 
    canvas.id === id ? { ...canvas, ...updates } : canvas
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCanvases));
  return updatedCanvases;
};

export const deleteCanvas = (canvasId: string): Canvas[] => {
  const canvases = getCanvases();
  const updatedCanvases = canvases.filter(canvas => canvas.id !== canvasId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCanvases));
  return updatedCanvases;
};
