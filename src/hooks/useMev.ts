// relayscan.io MEV-Boost: Ethereum block-builder + relay market share (24h).
// Worker-proxied (/api/mev), KV-cached; totals computed server-side.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface MevBuilder {
  name: string;
  pct: number;
  blocks: number;
  profit_eth: number | null;
}

export interface MevRelay {
  name: string;
  pct: number;
  payloads: number;
}

export interface MevData {
  builders: MevBuilder[];
  relays: MevRelay[];
  total_blocks: number;
  total_mev_eth: number | null;
  top_builder_pct: number;
  centralized: boolean;
  window: string;
  source: string;
}

const ENDPOINT = '/api/mev';
const CACHE_KEY = 'mev';
const POLL_MS = 10 * 60_000;

export function useMev(): MevData | null {
  const [data, setData] = useState<MevData | null>(() => getCache<MevData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: MevData | undefined = json?.data;
        if (!d || !Array.isArray(d.builders)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'mev');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Mev]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
