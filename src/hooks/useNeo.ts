// NASA Near Earth Objects: asteroid close approaches over the next 7 days.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface NeoObject {
  id: string;
  name: string;
  hazardous: boolean;
  sentry_object: boolean;
  absolute_magnitude_h: number;
  diameter_m_min: number;
  diameter_m_max: number;
  close_approach_date: string;
  relative_velocity_kmh: number | null;
  miss_distance_km: number | null;
  miss_distance_lunar: number | null;
  orbiting_body: string;
  url: string;
}

export interface NeoData {
  window: { start: string; end: string };
  total: number;
  hazardous_count: number;
  closest_first: NeoObject[];
}

const ENDPOINT = '/api/neo';
const CACHE_KEY = 'neo';
const POLL_MS = 60 * 60_000;

export function useNeo(): NeoData | null {
  const [data, setData] = useState<NeoData | null>(() => getCache<NeoData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(10000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: NeoData | undefined = json?.data;
        if (!d || !Array.isArray(d.closest_first)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'neo');
      } catch (e) { if (import.meta.env.DEV) console.warn('[NEO]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
