'use client';

import React from "react";
import { FiArrowUp, FiArrowDown, FiPlus, FiMoreVertical } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MDEditor from "@uiw/react-md-editor";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.css";

interface TextBlockProps {
  id: number;
  content: string;
  moveBlock: (blockId: number, direction: 'up' | 'down') => void;
  updateBlock: (id: number, content: string) => void;
  deleteBlock: (id: number) => void;
  addBlock: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const TextBlock = ({ 
  id, 
  content, 
  moveBlock, 
  updateBlock, 
  deleteBlock,
  addBlock,
  isFirst,
  isLast 
}: TextBlockProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isGptDialogOpen, setIsGptDialogOpen] = React.useState(false);
  const [customPrompt, setCustomPrompt] = React.useState("");
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

  const handleAIOperation = (operation: string) => {
    switch (operation) {
      case "elaborate":
        updateBlock(id, `Elaborate this in more detail: ${content}`);
        break;
      case "simplify":
        updateBlock(id, `Simplify this text: ${content}`);
        break;
      case "academic":
        updateBlock(id, `Make this more academic: ${content}`);
        break;
      case "summarize":
        updateBlock(id, `Summarize this: ${content}`);
        break;
    }
  };

  const handleCustomGPTPrompt = () => {
    if (customPrompt.trim()) {
      updateBlock(id, `${customPrompt}: ${content}`);
      setIsGptDialogOpen(false);
      setCustomPrompt("");
    }
  };

  return (
    <div
      className="relative mb-6 rounded-xl border border-gray-100 bg-white shadow-sm transition-all group"
      data-color-mode="light"
    >
      {/* Add Block Above Button - Only visible on hover */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="sm"
          className="h-8 bg-white"
          onClick={addBlock}
        >
          <FiPlus className="h-4 w-4 mr-1" />
          Add Above
        </Button>
      </div>

      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-2 rounded-t-xl">
        <div className="flex items-center space-x-1">
          <button 
            className={`p-1.5 hover:bg-gray-200 rounded-md text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={() => moveBlock(id, 'up')}
            disabled={isFirst}
            title="Move Up"
          >
            <FiArrowUp className="h-4 w-4" />
          </button>
          <button 
            className={`p-1.5 hover:bg-gray-200 rounded-md text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={() => moveBlock(id, 'down')}
            disabled={isLast}
            title="Move Down"
          >
            <FiArrowDown className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <FiMoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem key="elaborate" onClick={() => handleAIOperation("elaborate")}>
                Elaborate in Detail
              </DropdownMenuItem>
              <DropdownMenuItem key="simplify" onClick={() => handleAIOperation("simplify")}>
                Simplify Text
              </DropdownMenuItem>
              <DropdownMenuItem key="academic" onClick={() => handleAIOperation("academic")}>
                Make Academic
              </DropdownMenuItem>
              <DropdownMenuItem key="summarize" onClick={() => handleAIOperation("summarize")}>
                Summarize
              </DropdownMenuItem>
              <DropdownMenuSeparator key="separator-1" />
              <DropdownMenuItem key="custom" onClick={() => setIsGptDialogOpen(true)}>
                Custom GPT Prompt...
              </DropdownMenuItem>
              <DropdownMenuSeparator key="separator-2" />
              <DropdownMenuItem key="delete" onClick={() => deleteBlock(id)} className="text-red-600">
                Delete Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div ref={editorRef}>
        <MDEditor
          value={content}
          onChange={(value) => updateBlock(id, value || "")}
          preview={isEditing ? "edit" : "preview"}
          previewOptions={{
            rehypePlugins: [[rehypeKatex]],
            remarkPlugins: [[remarkMath]],
          }}
          className="!border-none"
        />
      </div>

      {/* Add Block Below Button - Only visible on hover */}
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="sm"
          className="h-8 bg-white"
          onClick={addBlock}
        >
          <FiPlus className="h-4 w-4 mr-1" />
          Add Below
        </Button>
      </div>

      {/* Custom GPT Dialog */}
      <Dialog open={isGptDialogOpen} onOpenChange={setIsGptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom GPT Prompt</DialogTitle>
            <DialogDescription>
              Enter your custom instruction for GPT to process this text block.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="E.g., Translate to Spanish..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomGPTPrompt}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
