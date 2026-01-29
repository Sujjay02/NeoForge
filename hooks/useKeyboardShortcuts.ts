import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs/textareas
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Cmd/Ctrl+Enter even in inputs
      if (!(e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
        return;
      }
    }

    for (const shortcut of shortcuts) {
      const metaOrCtrl = e.metaKey || e.ctrlKey;
      const metaMatch = shortcut.meta ? metaOrCtrl : !shortcut.meta;
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey : true;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        metaMatch &&
        ctrlMatch &&
        shiftMatch
      ) {
        e.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Helper to format shortcut for display
export function formatShortcut(shortcut: ShortcutConfig): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  if (shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.ctrl && !shortcut.meta) {
    parts.push('Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  const keyDisplay = shortcut.key === 'Enter' ? '↵' : shortcut.key.toUpperCase();
  parts.push(keyDisplay);

  return parts.join(isMac ? '' : '+');
}
