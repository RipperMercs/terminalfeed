import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface HistoricalEvent {
  year: number;
  text: string;
}

const CACHE_KEY = 'this_day_history';

export function useThisDay(): HistoricalEvent[] {
  const [events, setEvents] = useState<HistoricalEvent[]>(() => {
    return getCache<HistoricalEvent[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        // worker proxy (wikimedia onthisday), rule #6: worker computes today's date
        const res = await fetch('/api/this-day', { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const data = await res.json();

        if (data.events) {
          const selected = data.events
            .filter((e: { year?: number; text?: string }) => e.year && e.text)
            .sort(() => Math.random() - 0.5)
            .slice(0, 6)
            .sort((a: { year: number }, b: { year: number }) => a.year - b.year);

          if (selected.length > 0 && mountedRef.current) {
            setEvents(selected);
            setCache(CACHE_KEY, selected, 'wikimedia');
          }
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[ThisDay]', e); }
    };

    fetch_();
    // Daily content: no interval needed, just fetch on mount
    return () => { mountedRef.current = false; };
  }, []);

  return events;
}
