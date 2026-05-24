// NOAA OVATION aurora visibility forecast aggregated by hemisphere.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface AuroraHemisphere {
  max_percent: number;
  band: { label: string; tone: string };
  cells_above_10pct: number;
  cells_above_50pct: number;
}

export interface AuroraData {
  observation_time: string | null;
  forecast_time: string | null;
  northern_hemisphere: AuroraHemisphere;
  southern_hemisphere: AuroraHemisphere;
  total_cells_sampled: number;
}

const ENDPOINT = '/api/aurora';
const CACHE_KEY = 'aurora';
const POLL_MS = 5 * 60_000;

export function useAurora(): AuroraData | null {
  const [data, setData] = useState<AuroraData | null>(() => getCache<AuroraData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: AuroraData | undefined = json?.data;
        if (!d || !d.northern_hemisphere) return;
        setData(d);
        setCache(CACHE_KEY, d, 'aurora');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Aurora]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
