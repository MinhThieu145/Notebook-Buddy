export interface Block {
  id: number;
  content: string;
}

export interface Canvas {
  id: string;
  title: string;
  editedAt: string;
  blocks: Block[];
}

const STORAGE_KEY = 'canvas_docs';

export const getCanvases = (): Canvas[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveCanvases = (canvases: Canvas[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases));
};

export const addCanvas = (canvas: Canvas) => {
  const canvases = getCanvases();
  canvases.unshift(canvas); // Add new canvas at the beginning
  saveCanvases(canvases);
  return canvases;
};

export const getCanvas = (id: string): Canvas | undefined => {
  const canvases = getCanvases();
  return canvases.find(canvas => canvas.id === id);
};

export const updateCanvas = (id: string, updates: Partial<Canvas>) => {
  const canvases = getCanvases();
  const index = canvases.findIndex(canvas => canvas.id === id);
  if (index !== -1) {
    canvases[index] = { ...canvases[index], ...updates };
    saveCanvases(canvases);
  }
  return canvases[index];
};
