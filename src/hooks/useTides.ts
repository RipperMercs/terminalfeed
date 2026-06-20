// NOAA CO-OPS tide gauges: observed water level, next high/low, and the
// observed-minus-predicted residual (storm-surge signal). Worker-proxied
// (/api/tides), KV-cached; residual computed server-side.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface TideExtreme {
  t: string;
  v: number | null;
}

export interface TideStation {
  id: string;
  name: string;
  label: string;
  level: number | null;     // observed water level, ft @ MLLW
  time: string | null;      // station-local observation time
  residual: number | null;  // observed - predicted, ft (surge signal)
  next_high: TideExtreme | null;
  next_low: TideExtreme | null;
}

export interface TideData {
  count: number;
  stations: TideStation[];
  source: string;
}

const ENDPOINT = '/api/tides';
const CACHE_KEY = 'tides';
const POLL_MS = 4 * 60_000;

export function useTides(): TideData | null {
  const [data, setData] = useState<TideData | null>(() => getCache<TideData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: TideData | undefined = json?.data;
        if (!d || !Array.isArray(d.stations)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'tides');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Tides]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
