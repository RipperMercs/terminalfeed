// IODA country-level internet outages (warning/critical, trailing 24h).
// Worker-proxied (/api/outages), KV-cached.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface Outage {
  code: string;
  name: string;
  datasource: string;
  time: number;
  value: number | null;
  history_value: number | null;
}

export interface OutageData {
  count: number;
  outages: Outage[];
  source: string;
}

const ENDPOINT = '/api/outages';
const CACHE_KEY = 'outages';
const POLL_MS = 8 * 60_000;

export function useOutages(): OutageData | null {
  const [data, setData] = useState<OutageData | null>(() => getCache<OutageData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: OutageData | undefined = json?.data;
        if (!d || !Array.isArray(d.outages)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'outages');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Outages]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
