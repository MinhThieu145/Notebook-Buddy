import { useEffect, RefObject } from 'react';

/**
 * A hook that handles clicks outside of a specified element
 * 
 * @param ref - React ref object pointing to the element to detect clicks outside of
 * @param handler - Callback function to execute when a click outside is detected
 * @param isActive - Optional boolean to conditionally enable/disable the click outside detection
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent) => void,
  isActive: boolean = true
): void {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isActive) return;
      
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event);
      }
    }

    if (isActive) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler, isActive]);
}

export default useClickOutside;
