import { useState, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'tf_watchlist_';

export type SortMode = 'default' | 'change' | 'price' | 'name';

export function useWatchlist(panelId: string) {
  const storageKey = STORAGE_KEY_PREFIX + panelId;

  const [custom, setCustom] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [sortMode, setSortMode] = useState<SortMode>('default');

  const addSymbol = useCallback((symbol: string) => {
    const upper = symbol.toUpperCase().trim();
    if (!upper) return;
    setCustom((prev) => {
      if (prev.includes(upper)) return prev;
      const next = [...prev, upper];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const removeSymbol = useCallback((symbol: string) => {
    setCustom((prev) => {
      const next = prev.filter((s) => s !== symbol);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const cycleSortMode = useCallback(() => {
    setSortMode((prev) => {
      const modes: SortMode[] = ['default', 'change', 'price', 'name'];
      const idx = modes.indexOf(prev);
      return modes[(idx + 1) % modes.length];
    });
  }, []);

  return { custom, addSymbol, removeSymbol, sortMode, cycleSortMode };
}
