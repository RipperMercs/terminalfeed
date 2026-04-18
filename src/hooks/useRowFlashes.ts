import { useEffect, useRef, useState } from 'react';

export type FlashDir = 'up' | 'dn';

interface Options {
  /** How long to keep the flash class applied. Defaults to 900ms. */
  durationMs?: number;
}

/**
 * Track per-row value changes and expose a { [key]: 'up' | 'dn' } map that
 * callers can turn into CSS classes. Entries auto-clear after durationMs.
 */
export function useRowFlashes<T>(
  items: readonly T[],
  getKey: (item: T) => string,
  getValue: (item: T) => number,
  opts: Options = {},
): Record<string, FlashDir> {
  const duration = opts.durationMs ?? 900;
  const prevRef = useRef<Record<string, number>>({});
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [flashes, setFlashes] = useState<Record<string, FlashDir>>({});

  useEffect(() => {
    const prev = prevRef.current;
    const newFlashes: Record<string, FlashDir> = {};

    for (const item of items) {
      const key = getKey(item);
      const value = getValue(item);
      if (!Number.isFinite(value) || value <= 0) continue;
      const prior = prev[key];
      if (typeof prior === 'number' && prior !== value) {
        newFlashes[key] = value > prior ? 'up' : 'dn';
      }
      prev[key] = value;
    }

    if (Object.keys(newFlashes).length === 0) return;

    setFlashes(cur => ({ ...cur, ...newFlashes }));
    for (const key of Object.keys(newFlashes)) {
      if (timerRef.current[key]) clearTimeout(timerRef.current[key]);
      timerRef.current[key] = setTimeout(() => {
        setFlashes(cur => {
          if (!cur[key]) return cur;
          const next = { ...cur };
          delete next[key];
          return next;
        });
        delete timerRef.current[key];
      }, duration);
    }
  }, [items, getKey, getValue, duration]);

  useEffect(() => {
    const timers = timerRef.current;
    return () => {
      for (const key of Object.keys(timers)) clearTimeout(timers[key]);
    };
  }, []);

  return flashes;
}
