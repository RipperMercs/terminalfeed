// Recent perp futures liquidations across BTC / ETH / SOL via OKX.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface LiquidationEvent {
  symbol: string;
  side: 'long' | 'short';
  price: number;
  notional_usd: number;
  time: number;
}

export interface LiquidationsData {
  recent: LiquidationEvent[];
  totals: {
    count: number;
    long_notional_usd: number;
    short_notional_usd: number;
    long_count: number;
    short_count: number;
  };
  biggest: LiquidationEvent | null;
  by_symbol: Record<string, {
    count: number;
    long_notional_usd: number;
    short_notional_usd: number;
  }>;
}

const ENDPOINT = '/api/liquidations';
const CACHE_KEY = 'liquidations';
const POLL_MS = 60_000;

export function useLiquidations(): LiquidationsData | null {
  const [data, setData] = useState<LiquidationsData | null>(() => getCache<LiquidationsData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: LiquidationsData | undefined = json?.data;
        if (!d || !d.totals) return;
        setData(d);
        setCache(CACHE_KEY, d, 'liquidations');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Liq]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
