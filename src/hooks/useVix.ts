// CBOE VIX + Nasdaq volatility ("fear gauges" for stocks).

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface VixSeries {
  value: number | null;
  date: string | null;
  change_1d?: number | null;
  change_5d?: number | null;
  classification: { band: string; label: string; tone: string } | null;
}

export interface VixData {
  vix: VixSeries;
  vxn: VixSeries;
  vix_history_5d: { date: string; value: number }[];
}

const ENDPOINT = '/api/vix';
const CACHE_KEY = 'vix';
const POLL_MS = 60 * 60_000;

export function useVix(): VixData | null {
  const [data, setData] = useState<VixData | null>(() => getCache<VixData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: VixData | undefined = json?.data;
        if (!d || !d.vix) return;
        setData(d);
        setCache(CACHE_KEY, d, 'vix');
      } catch (e) { if (import.meta.env.DEV) console.warn('[VIX]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
