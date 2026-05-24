// Top DeFi protocols by TVL via DefiLlama free API.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface DefiProtocol {
  name: string;
  symbol: string;
  category: string;
  chain: string;
  chains: string[];
  tvl_usd: number;
  change_1h_pct: number | null;
  change_1d_pct: number | null;
  change_7d_pct: number | null;
  is_cex_reserves: boolean;
  url: string | null;
}

export interface DefiTvlData {
  protocol_count: number;
  total_tvl_usd: number;
  defi_only_tvl_usd: number;
  top: DefiProtocol[];
}

const ENDPOINT = '/api/defi-tvl-free';
const CACHE_KEY = 'defi-tvl-free';
const POLL_MS = 15 * 60_000;

export function useDefiTvl(): DefiTvlData | null {
  const [data, setData] = useState<DefiTvlData | null>(() => getCache<DefiTvlData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(10000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: DefiTvlData | undefined = json?.data;
        if (!d || !Array.isArray(d.top)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'defi-tvl-free');
      } catch (e) { if (import.meta.env.DEV) console.warn('[DeFi]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
