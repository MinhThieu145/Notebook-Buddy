# Hooks Directory

This directory contains custom React hooks organized by their scope and purpose.

## Directory Structure

- **common/**: Contains reusable hooks that can be used across the entire application
  - `useClickOutside.ts`: A hook for detecting clicks outside a specified element

- **canvasPage/**: Contains hooks specific to the Canvas Home Page
  - `useCanvasFetch.ts`: A hook for fetching canvases from the API or local storage
  - `useCanvasOperations.ts`: A hook for canvas operations such as creating and deleting canvases

## Usage Guidelines

### Common Hooks

Common hooks should be designed to be reusable across the application. They should:
- Be focused on a single responsibility
- Have clear, well-documented interfaces
- Be thoroughly tested
- Not depend on specific page or component logic

Example usage of `useClickOutside`:

```tsx
import { useRef } from 'react';
import { useClickOutside } from '@/app/hooks/common';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  // The handler will be called when a click outside the ref element is detected
  useClickOutside(ref, () => setIsOpen(false), isOpen);
  
  return (
    <div ref={ref}>
      {/* Your component content */}
    </div>
  );
}
```

### Page-Specific Hooks

Page-specific hooks encapsulate logic that is specific to a particular page or feature. They should:
- Be placed in a directory named after the page or feature they support
- Extract complex logic from components to make them more readable
- Handle data fetching, state management, and other side effects

Example usage of canvas page hooks:

```tsx
import { useCanvasFetch, useCanvasOperations } from '@/app/hooks/canvasPage';

function CanvasPage() {
  // Get canvases and loading state
  const { canvases, setCanvases, isLoading } = useCanvasFetch();
  
  // Get canvas operations
  const { createCanvas, deleteCanvas } = useCanvasOperations(setCanvases);
  
  // Use these hooks in your component
  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <button onClick={createCanvas}>Create Canvas</button>
          {canvases.map(canvas => (
            <div key={canvas.id}>
              <h2>{canvas.title}</h2>
              <button onClick={() => deleteCanvas(canvas.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Adding New Hooks

When adding new hooks, follow these guidelines:

1. Determine if the hook is reusable across the application or specific to a page/feature
2. Place it in the appropriate directory (common or page-specific)
3. Use TypeScript for type safety
4. Add comprehensive documentation with JSDoc comments
5. Export the hook from the directory's index.ts file
6. Consider adding tests for complex hooks

## Best Practices

- Keep hooks focused on a single responsibility
- Use TypeScript for better type safety and developer experience
- Document your hooks with JSDoc comments
- Export hooks from index.ts files to make imports cleaner
- Consider the dependencies of your hooks to avoid unnecessary re-renders
- Use the useCallback and useMemo hooks for performance optimization when necessary
