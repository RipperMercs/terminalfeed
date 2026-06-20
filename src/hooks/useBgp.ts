// RIPEstat BGP route watch for a few large networks. Worker-proxied (/api/bgp),
// KV-cached; 24h-ish delta + sharp-change flag computed server-side.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface BgpNetwork {
  asn: string;
  name: string;
  v4: number | null;
  v6: number | null;
  neighbours: number | null;
  v4_delta: number | null;
  v6_delta: number | null;
  flag: boolean;
  query_time: string | null;
  stale_net?: boolean;
}

export interface BgpData {
  count: number;
  networks: BgpNetwork[];
  source: string;
}

const ENDPOINT = '/api/bgp';
const CACHE_KEY = 'bgp';
const POLL_MS = 8 * 60_000;

export function useBgp(): BgpData | null {
  const [data, setData] = useState<BgpData | null>(() => getCache<BgpData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: BgpData | undefined = json?.data;
        if (!d || !Array.isArray(d.networks)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'bgp');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Bgp]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
