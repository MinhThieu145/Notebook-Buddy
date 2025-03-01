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
  id: string;
  content: string;
  moveBlock: (blockId: string, direction: 'up' | 'down') => void;
  updateBlock: (id: string, content: string) => void;
  deleteBlock: (id: string) => void;
  addBlock: (positionOrId?: number | string) => void;
  isFirst: boolean;
  isLast: boolean;
  blocks: { id: string }[];
}

export const TextBlock = ({ 
  id, 
  content, 
  moveBlock, 
  updateBlock, 
  deleteBlock,
  addBlock,
  isFirst,
  isLast,
  blocks
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
      {/* Controls */}
      <div className="absolute -left-10 top-3 flex flex-col items-center space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => moveBlock(id, 'up')}
          disabled={isFirst}
          className="h-8 w-8"
        >
          <FiArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => moveBlock(id, 'down')}
          disabled={isLast}
          className="h-8 w-8"
        >
          <FiArrowDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Menu */}
      <div className="absolute -right-10 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* Content Area */}
      <div className="px-4 py-3" ref={editorRef}>
        {isEditing ? (
          <MDEditor
            value={content}
            onChange={(value) => updateBlock(id, value || '')}
            previewOptions={{
              rehypePlugins: [[rehypeKatex]],
              remarkPlugins: [[remarkMath]],
            }}
            height="auto"
            preview="live"
            visibleDragbar={false}
          />
        ) : (
          <div 
            onDoubleClick={() => setIsEditing(true)}
            className="cursor-text min-h-[50px] prose prose-sm max-w-none"
          >
            <MDEditor.Markdown
              source={content}
              rehypePlugins={[[rehypeKatex]]}
              remarkPlugins={[[remarkMath]]}
              className="wmde-markdown"
            />
          </div>
        )}
      </div>

      {/* Add Block Above Button - Only visible on hover */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="sm"
          className="h-8 bg-white"
          onClick={(e) => {
            e.preventDefault();
            addBlock(blocks.findIndex(block => block.id === id));
          }}
        >
          <FiPlus className="h-4 w-4 mr-1" />
          Add Above
        </Button>
      </div>

      {/* Add Block Below Button - Only visible on hover */}
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="sm"
          className="h-8 bg-white"
          onClick={(e) => {
            e.preventDefault();
            addBlock(blocks.findIndex(block => block.id === id) + 1);
          }}
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
