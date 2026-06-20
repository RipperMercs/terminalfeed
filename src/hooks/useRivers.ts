// USGS River Watch: live streamflow + gage height at iconic US gauges.
// Worker-proxied (/api/rivers), KV-cached; delta + flood flag computed server-side.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface RiverSite {
  id: string;
  name: string;
  flow: number | null;       // discharge, cfs
  gage: number | null;       // gage height, ft
  time: string | null;       // ISO observation time
  flow_delta: number | null; // vs prior reading
  gage_delta: number | null;
  flood_ft: number | null;   // NWS flood stage (gage ft), or null if not tracked
  flooding: boolean;
  stale_site?: boolean;
}

export interface RiverData {
  count: number;
  sites: RiverSite[];
  source: string;
}

const ENDPOINT = '/api/rivers';
const CACHE_KEY = 'rivers';
const POLL_MS = 4 * 60_000;

export function useRivers(): RiverData | null {
  const [data, setData] = useState<RiverData | null>(() => getCache<RiverData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: RiverData | undefined = json?.data;
        if (!d || !Array.isArray(d.sites)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'rivers');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Rivers]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
