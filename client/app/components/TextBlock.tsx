'use client';

import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { FiMove, FiTrash2, FiEdit3, FiMaximize2, FiMinimize2 } from "react-icons/fi";
import MDEditor from "@uiw/react-md-editor";

interface TextBlockProps {
  id: number;
  content: string;
  index: number;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  updateBlock: (id: number, content: string) => void;
  deleteBlock: (id: number) => void;
}

export const TextBlock = ({ id, content, index, moveBlock, updateBlock, deleteBlock }: TextBlockProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: "TEXT_BLOCK",
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [, drop] = useDrop({
    accept: "TEXT_BLOCK",
    hover: (item: { index: number }, monitor) => {
      if (item.index !== index) {
        moveBlock(item.index, index);
        item.index = index;
      }
    }
  });

  return (
    <div
      ref={node => {
        drag(node);
        drop(node);
      }}
      className={`relative mb-6 rounded-xl border border-gray-100 bg-white shadow-sm transition-all ${isDragging ? "opacity-50" : ""}`}
      data-color-mode="light"
    >
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-2 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <button className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500">
            <FiMove className="h-4 w-4" />
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
        <MDEditor
          value={content}
          onChange={(value) => updateBlock(id, value || "")}
          preview="live"
          hideToolbar={true}
          className="border-none shadow-none"
          height={200}
        />
      </div>
    </div>
  );
};
