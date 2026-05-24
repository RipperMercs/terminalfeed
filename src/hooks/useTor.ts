// Tor network relay + exit + bridge counts via Onionoo.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface TorData {
  running_relays: number | null;
  running_exits: number | null;
  exit_percent_of_relays: number | null;
  running_bridges: number | null;
  snapshot_at: string | null;
}

const ENDPOINT = '/api/tor';
const CACHE_KEY = 'tor';
const POLL_MS = 30 * 60_000;

export function useTor(): TorData | null {
  const [data, setData] = useState<TorData | null>(() => getCache<TorData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: TorData | undefined = json?.data;
        if (!d || d.running_relays == null) return;
        setData(d);
        setCache(CACHE_KEY, d, 'tor');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Tor]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
