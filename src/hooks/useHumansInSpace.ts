import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface SpacePerson {
  name: string;
  craft: string;
}

export interface HumansInSpaceData {
  count: number;
  people: SpacePerson[];
}

const CACHE_KEY = 'humans_in_space';
const POLL_MS = 60 * 60_000; // 1 hour

// Fallback data: updated periodically; better than showing nothing
const FALLBACK: HumansInSpaceData = {
  count: 7,
  people: [
    { name: 'Oleg Kononenko', craft: 'ISS' },
    { name: 'Nikolai Chub', craft: 'ISS' },
    { name: 'Tracy Dyson', craft: 'ISS' },
    { name: 'Matthew Dominick', craft: 'ISS' },
    { name: 'Michael Barratt', craft: 'ISS' },
    { name: 'Jeanette Epps', craft: 'ISS' },
    { name: 'Alexander Grebenkin', craft: 'ISS' },
  ],
};

export function useHumansInSpace(): HumansInSpaceData | null {
  const [data, setData] = useState<HumansInSpaceData | null>(() => {
    return getCache<HumansInSpaceData>(CACHE_KEY)?.data ?? FALLBACK;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        // Try worker endpoint first
        const res = await fetch('/api/humans-in-space', { signal: AbortSignal.timeout(5000) });
        if (res.ok && mountedRef.current) {
          const json = await res.json();
          if (json.data) {
            setData(json.data);
            setCache(CACHE_KEY, json.data, 'open-notify');
            return;
          }
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[HumansInSpace]', e); }

      // Worker failed: use cache or fallback (open-notify is HTTP-only, no direct fetch from HTTPS site)
      if (mountedRef.current && !getCache<HumansInSpaceData>(CACHE_KEY)?.data) {
        setData(FALLBACK);
      }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
