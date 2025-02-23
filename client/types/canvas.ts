export interface Block {
  id: string;
  content: string;
  position?: { x: number; y: number };
  order: number;
}

export interface Project {
  projectId: string;
  title: string;
  editedAt: string;  // Changed from lastModified to editedAt for consistency
  blocks: Block[];
}

export interface BlockData {
  id?: string;
  textBlockId?: string;
  content: string;
  position?: { x: number; y: number };
  order?: number;
}
