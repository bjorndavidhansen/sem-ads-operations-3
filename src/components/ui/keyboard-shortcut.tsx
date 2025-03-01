import { useEffect, useCallback } from 'react';

interface KeyboardShortcutProps {
  combination: string[];
  onTrigger: () => void;
  disabled?: boolean;
}

export function KeyboardShortcut({ combination, onTrigger, disabled = false }: KeyboardShortcutProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;

    const keys = combination.map(key => key.toLowerCase());
    const modifiers = {
      ctrl: keys.includes('ctrl') ? event.ctrlKey : true,
      alt: keys.includes('alt') ? event.altKey : true,
      shift: keys.includes('shift') ? event.shiftKey : true,
      meta: keys.includes('meta') ? event.metaKey : true
    };

    const mainKey = keys.find(key => !['ctrl', 'alt', 'shift', 'meta'].includes(key));
    
    if (
      mainKey &&
      event.key.toLowerCase() === mainKey.toLowerCase() &&
      modifiers.ctrl &&
      modifiers.alt &&
      modifiers.shift &&
      modifiers.meta
    ) {
      event.preventDefault();
      onTrigger();
    }
  }, [combination, onTrigger, disabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
}