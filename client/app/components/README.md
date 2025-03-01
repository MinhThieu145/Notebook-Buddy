# Components Structure

This directory contains reusable components for the Notebook Buddy application.

## Directory Structure

- `common/`: Contains reusable components that can be used across different pages and features
  - `ConfirmDialog.tsx`: A reusable confirmation dialog for confirming actions
  - `DropdownMenu.tsx`: A reusable dropdown menu component for various context menus

- `canvasHomePage/`: Contains components specific to the Canvas Home Page
  - `CanvasMenu.tsx`: A specialized dropdown menu for canvas items

## Usage Guidelines

### Common Components

These components are designed to be reused across the application. They have flexible props and can be customized for different use cases.

#### ConfirmDialog

Use this component whenever you need to confirm a potentially destructive action with the user.

```tsx
<ConfirmDialog
  isOpen={isDialogOpen}
  title="Delete Item"
  message="Are you sure you want to delete this item?"
  confirmText="Delete" // Optional, defaults to "Confirm"
  cancelText="Cancel" // Optional, defaults to "Cancel"
  confirmButtonClass="bg-red-600 hover:bg-red-700" // Optional
  onConfirm={() => handleDelete()}
  onCancel={() => setIsDialogOpen(false)}
/>
```

#### DropdownMenu

Use this component to create dropdown menus throughout the application.

```tsx
const menuItems = [
  {
    id: 'edit',
    label: 'Edit',
    icon: <PencilIcon className="h-5 w-5" />,
    onClick: handleEdit
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <TrashIcon className="h-5 w-5" />,
    onClick: handleDelete,
    className: 'text-red-600'
  }
];

<DropdownMenu
  isOpen={isMenuOpen}
  items={menuItems}
  menuRef={menuRef}
  position="top-right" // Optional, defaults to 'top-right'
  width="w-48" // Optional, defaults to 'w-48'
/>
```

### Page-Specific Components

These components are designed for specific pages or features and may have more specialized behavior.

#### CanvasMenu

This component is specifically designed for the Canvas Home Page to provide context menu functionality for canvas items.

```tsx
<CanvasMenu
  isOpen={isMenuOpen}
  canvasId={canvas.id}
  onDelete={() => handleDeleteCanvas(canvas.id)}
  onMoveToFolder={() => handleMoveToFolder(canvas.id)}
  menuRef={menuRef}
/>
```

## Adding New Components

When adding new components:

1. Determine if the component is generic enough to be used across the application. If so, place it in the `common/` directory.
2. If the component is specific to a particular page or feature, create a new directory for that page/feature if it doesn't exist already.
3. Follow the naming convention of existing components.
4. Add proper TypeScript types and JSDoc comments to document the component's purpose and usage.
