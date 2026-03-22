
import { useRef, useCallback } from 'react';

export const useAutoScroll = () => {
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const registerRef = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  const scrollToExercise = useCallback((exerciseId: string) => {
    const node = itemRefs.current.get(exerciseId);
    if (node) {
      // Small delay to allow keyboard to dismiss or UI to settle
      setTimeout(() => {
        node.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, []);

  return { registerRef, scrollToExercise };
};
