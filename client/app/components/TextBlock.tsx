'use client';

import React from "react";
import { FiArrowUp, FiArrowDown, FiTrash2, FiEdit3, FiMaximize2, FiMinimize2 } from "react-icons/fi";
import MDEditor from "@uiw/react-md-editor";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.css";

interface TextBlockProps {
  id: number;
  content: string;
  index: number;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  updateBlock: (id: number, content: string) => void;
  deleteBlock: (id: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

export const TextBlock = ({ 
  id, 
  content, 
  index, 
  moveBlock, 
  updateBlock, 
  deleteBlock,
  isFirst,
  isLast 
}: TextBlockProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const editorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEditing]);

  return (
    <div
      className="relative mb-6 rounded-xl border border-gray-100 bg-white shadow-sm transition-all"
      data-color-mode="light"
    >
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-2 rounded-t-xl">
        <div className="flex items-center space-x-1">
          <button 
            className={`p-1.5 hover:bg-gray-200 rounded-md text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={() => moveBlock(index, index - 1)}
            disabled={isFirst}
            title="Move Up"
          >
            <FiArrowUp className="h-4 w-4" />
          </button>
          <button 
            className={`p-1.5 hover:bg-gray-200 rounded-md text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={() => moveBlock(index, index + 1)}
            disabled={isLast}
            title="Move Down"
          >
            <FiArrowDown className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => updateBlock(id, content)}
            className="p-1.5 hover:bg-blue-100 rounded-md text-blue-600"
            title="Rewrite"
          >
            <FiEdit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => updateBlock(id, content)}
            className="p-1.5 hover:bg-green-100 rounded-md text-green-600"
            title="Simplify"
          >
            <FiMinimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => updateBlock(id, content)}
            className="p-1.5 hover:bg-purple-100 rounded-md text-purple-600"
            title="Expand"
          >
            <FiMaximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteBlock(id)}
            className="p-1.5 hover:bg-red-100 rounded-md text-red-600"
            title="Delete"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {isEditing ? (
          <div ref={editorRef}>
            <MDEditor
              value={content}
              onChange={(value) => updateBlock(id, value || "")}
              preview="live"
              hideToolbar={true}
              className="border-none shadow-none"
              height={200}
              previewOptions={{
                rehypePlugins: [[rehypeKatex, { output: 'html' }]],
                remarkPlugins: [remarkMath],
              }}
            />
          </div>
        ) : (
          <div 
            onDoubleClick={() => setIsEditing(true)}
            className="min-h-[50px] prose max-w-none"
          >
            <MDEditor.Markdown 
              source={content} 
              rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
              remarkPlugins={[remarkMath]}
            />
          </div>
        )}
      </div>
    </div>
  );
};
