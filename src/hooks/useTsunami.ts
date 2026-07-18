// NWS tsunami alerts from both warning centers (NTWC + PTWC). Worker-proxied
// (/api/tsunami), KV-cached. Most entries are information statements; `highest`
// escalates through watch / advisory / warning.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface TsunamiAlert {
  title: string;
  time: string;
  link: string;
  level: 'warning' | 'advisory' | 'watch' | 'info';
  center: string;
}

export interface TsunamiData {
  alerts: TsunamiAlert[];
  highest: 'warning' | 'advisory' | 'watch' | 'info' | 'none';
  centers_reporting: number;
}

const ENDPOINT = '/api/tsunami';
const CACHE_KEY = 'tsunami';
const POLL_MS = 5 * 60_000;

export function useTsunami(): TsunamiData | null {
  const [data, setData] = useState<TsunamiData | null>(() => getCache<TsunamiData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: TsunamiData | undefined = json?.data;
        if (!d || !Array.isArray(d.alerts)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'tsunami.gov');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Tsunami]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
