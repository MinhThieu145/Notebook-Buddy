import React, { ReactNode } from 'react';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
}

interface DropdownMenuProps {
  isOpen: boolean;
  items: DropdownMenuItem[];
  menuRef: React.RefObject<HTMLDivElement>;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  width?: string;
}

/**
 * A reusable dropdown menu component
 * 
 * @param isOpen - Whether the menu is visible
 * @param items - Array of menu items to display
 * @param menuRef - React ref for detecting clicks outside the menu
 * @param position - Position of the menu relative to its trigger (default: 'top-right')
 * @param width - Width of the menu (default: 'w-48')
 */
export function DropdownMenu({ 
  isOpen, 
  items, 
  menuRef,
  position = 'top-right',
  width = 'w-48'
}: DropdownMenuProps) {
  if (!isOpen) return null;

  // Determine position classes
  const positionClasses = {
    'top-right': 'right-0 top-8',
    'top-left': 'left-0 top-8',
    'bottom-right': 'right-0 bottom-8',
    'bottom-left': 'left-0 bottom-8'
  };

  return (
    <div 
      ref={menuRef}
      className={`absolute ${positionClasses[position]} z-50 ${width} rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
    >
      <div className="py-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`flex w-full items-center px-4 py-2 text-sm ${item.className || 'text-gray-700'} hover:bg-gray-100`}
          >
            {item.icon && <span className="mr-3">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DropdownMenu;
