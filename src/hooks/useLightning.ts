// Bitcoin Lightning Network capacity + node stats.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface LightningData {
  capacity_btc: number | null;
  capacity_sats: number | null;
  channel_count: number | null;
  node_count: number | null;
  tor_nodes: number | null;
  clearnet_nodes: number | null;
  unannounced_nodes: number | null;
  avg_capacity_sats: number | null;
  median_capacity_sats: number | null;
  avg_fee_rate_ppm: number | null;
  median_fee_rate_ppm: number | null;
  snapshot_date: string | null;
  previous_snapshot_date: string | null;
  delta_since_previous: {
    capacity_btc: number | null;
    channel_count: number | null;
    node_count: number | null;
  } | null;
}

const ENDPOINT = '/api/lightning';
const CACHE_KEY = 'lightning';
const POLL_MS = 60 * 60_000;

export function useLightning(): LightningData | null {
  const [data, setData] = useState<LightningData | null>(() => getCache<LightningData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: LightningData | undefined = json?.data;
        if (!d || d.channel_count == null) return;
        setData(d);
        setCache(CACHE_KEY, d, 'lightning');
      } catch (e) { if (import.meta.env.DEV) console.warn('[LN]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
