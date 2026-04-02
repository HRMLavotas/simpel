import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  callback: () => void;
  description?: string;
}

/**
 * Custom hook untuk menangani keyboard shortcuts
 * @param shortcuts - Array of keyboard shortcuts
 * @param enabled - Whether shortcuts are enabled (default: true)
 * 
 * @example
 * useKeyboardShortcuts([
 *   { key: 'k', ctrl: true, callback: () => openSearch(), description: 'Open search' },
 *   { key: 'n', ctrl: true, callback: () => createNew(), description: 'Create new' },
 *   { key: 'Escape', callback: () => closeModal(), description: 'Close modal' },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape key even in input fields
        if (event.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Hook untuk menampilkan keyboard shortcuts help dialog
 */
export function useKeyboardShortcutsHelp(shortcuts: KeyboardShortcut[]) {
  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const keys: string[] = [];
    
    if (shortcut.ctrl) keys.push('Ctrl');
    if (shortcut.alt) keys.push('Alt');
    if (shortcut.shift) keys.push('Shift');
    if (shortcut.meta) keys.push('Cmd');
    
    keys.push(shortcut.key.toUpperCase());
    
    return keys.join(' + ');
  };

  return shortcuts.map(shortcut => ({
    keys: formatShortcut(shortcut),
    description: shortcut.description || 'No description',
  }));
}
