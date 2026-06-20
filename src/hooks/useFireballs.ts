// JPL CNEOS fireball log: recent atmospheric impact events.
// Worker-proxied (/api/fireballs), KV-cached, served with as_of/age/stale.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface FireballEvent {
  date: string;
  energy_kt: number;
  lat: number | null;
  lon: number | null;
  alt_km: number | null;
  vel_kms: number | null;
}

export interface FireballData {
  count: number;
  events: FireballEvent[];
  source: string;
}

const ENDPOINT = '/api/fireballs';
const CACHE_KEY = 'fireballs';
const POLL_MS = 20 * 60_000;

export function useFireballs(): FireballData | null {
  const [data, setData] = useState<FireballData | null>(() => getCache<FireballData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: FireballData | undefined = json?.data;
        if (!d || !Array.isArray(d.events)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'fireballs');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Fireballs]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
