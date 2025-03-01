import React from 'react';
import { TrashIcon, FolderIcon } from '@heroicons/react/24/outline';
import { DropdownMenu, DropdownMenuItem } from '../common/DropdownMenu';

interface CanvasMenuProps {
  isOpen: boolean;
  canvasId: string;
  onDelete: () => void;
  onMoveToFolder: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

/**
 * Canvas-specific dropdown menu component
 * 
 * @param isOpen - Whether the menu is visible
 * @param canvasId - ID of the canvas this menu is for
 * @param onDelete - Function to call when the user clicks delete
 * @param onMoveToFolder - Function to call when the user clicks move to folder
 * @param menuRef - React ref for detecting clicks outside the menu
 */
export function CanvasMenu({ 
  isOpen, 
  canvasId, 
  onDelete, 
  onMoveToFolder, 
  menuRef 
}: CanvasMenuProps) {
  const menuItems: DropdownMenuItem[] = [
    {
      id: `move-${canvasId}`,
      label: 'Move to folder',
      icon: <FolderIcon className="h-5 w-5" />,
      onClick: onMoveToFolder
    },
    {
      id: `delete-${canvasId}`,
      label: 'Delete',
      icon: <TrashIcon className="h-5 w-5" />,
      onClick: onDelete,
      className: 'text-red-600'
    }
  ];

  return (
    <DropdownMenu
      isOpen={isOpen}
      items={menuItems}
      menuRef={menuRef}
      position="top-right"
      width="w-48"
    />
  );
}

export default CanvasMenu;
