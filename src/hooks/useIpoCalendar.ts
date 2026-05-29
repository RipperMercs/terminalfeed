import { useState, useEffect, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface IpoEvent {
  symbol: string;
  name: string;
  date: string;
  exchange: string;
  price: string;
  shares: number | null;
  status: string;
}

// Upcoming US IPOs come from Finnhub via the Worker at /api/ipo-calendar.
// The Finnhub key lives in a Worker secret, never client-side.
const CACHE_KEY = 'ipo_calendar';
const POLL_MS = 60 * 60_000; // 1h
const MAX_ITEMS = 12;

async function fetchIpos(): Promise<IpoEvent[]> {
  try {
    const res = await fetch('/api/ipo-calendar', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const list: IpoEvent[] = Array.isArray(json?.data) ? json.data : [];
    return list.slice(0, MAX_ITEMS);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[IpoCalendar]', e);
    return [];
  }
}

export function useIpoCalendar() {
  const [ipos, setIpos] = useState<IpoEvent[]>(() => {
    return getCache<IpoEvent[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const doFetch = async () => {
      if (!mountedRef.current) return;
      const items = await fetchIpos();
      if (mountedRef.current && items.length > 0) {
        setIpos(items);
        setCache(CACHE_KEY, items, 'ipo');
      }
    };

    const timer = setTimeout(doFetch, 3000);
    const id = setInterval(doFetch, POLL_MS);
    return () => { mountedRef.current = false; clearTimeout(timer); clearInterval(id); };
  }, []);

  return ipos;
}
