// FAA National Airspace System status: ground stops, ground delay programs,
// closures, arrival/departure delays. Worker-proxied (/api/faa-status),
// KV-cached. All-empty is a valid quiet-sky state.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface FaaGroundStop { airport: string; end_time: string; reason: string; }
export interface FaaGroundDelay { airport: string; avg: string; reason: string; }
export interface FaaClosure { airport: string; reason: string; reopen: string; }
export interface FaaDelay { airport: string; reason: string; min: string; max: string; trend: string; }

export interface FaaStatusData {
  updated: string;
  ground_stops: FaaGroundStop[];
  ground_delays: FaaGroundDelay[];
  closures: FaaClosure[];
  delays: FaaDelay[];
  total_events: number;
}

const ENDPOINT = '/api/faa-status';
const CACHE_KEY = 'faa_status';
const POLL_MS = 3 * 60_000;

export function useFaaStatus(): FaaStatusData | null {
  const [data, setData] = useState<FaaStatusData | null>(() => getCache<FaaStatusData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: FaaStatusData | undefined = json?.data;
        if (!d || !Array.isArray(d.ground_stops)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'faa');
      } catch (e) { if (import.meta.env.DEV) console.warn('[FaaStatus]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
