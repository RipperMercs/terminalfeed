// Kalshi CFTC-regulated event markets: top open events by 24h volume with the
// leading outcome per event. Worker-proxied (/api/kalshi), KV-cached, sports
// parlays filtered server-side.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface KalshiMarket {
  title: string;
  category: string;
  leader: string;
  leader_pct: number;
  volume_24h: number;
}

export interface KalshiData {
  markets: KalshiMarket[];
}

const ENDPOINT = '/api/kalshi';
const CACHE_KEY = 'kalshi';
const POLL_MS = 5 * 60_000;

export function useKalshi(): KalshiData | null {
  const [data, setData] = useState<KalshiData | null>(() => getCache<KalshiData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retried = false;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: KalshiData | undefined = json?.data;
        if (!d || !Array.isArray(d.markets) || d.markets.length === 0) {
          // KV feed still warming: one short retry instead of an empty panel
          // until the next poll tick.
          if (!retried && mountedRef.current) { retried = true; retryTimer = setTimeout(fetch_, 20000); }
          return;
        }
        retried = false;
        setData(d);
        setCache(CACHE_KEY, d, 'kalshi');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Kalshi]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); if (retryTimer) clearTimeout(retryTimer); };
  }, []);

  return data;
}
