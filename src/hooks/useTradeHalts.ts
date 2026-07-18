// NASDAQ trade halts: when a stock halts, that IS the news. Worker-proxied
// (/api/trade-halts), KV-cached server-side. An empty list is a valid state
// (no active halts), distinct from "not loaded yet" (null).

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface TradeHalt {
  symbol: string;
  name: string;
  market: string;
  reason: string;
  halt_date: string;
  halt_time: string;
  resume_date: string;
  resume_trade_time: string;
}

export interface TradeHaltsData {
  halts: TradeHalt[];
  count: number;
}

const ENDPOINT = '/api/trade-halts';
const CACHE_KEY = 'trade_halts';
const POLL_MS = 2 * 60_000;

export function useTradeHalts(): TradeHaltsData | null {
  const [data, setData] = useState<TradeHaltsData | null>(() => getCache<TradeHaltsData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: TradeHaltsData | undefined = json?.data;
        if (!d || !Array.isArray(d.halts)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'nasdaq');
      } catch (e) { if (import.meta.env.DEV) console.warn('[TradeHalts]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
