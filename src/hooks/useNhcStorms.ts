// NOAA NHC current named storms. Often empty outside hurricane season.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface NhcStorm {
  id: string | null;
  name: string;
  classification: string;      // 'TD', 'TS', 'HU', 'MH', etc.
  intensity_mph: number | null;
  pressure_mb: number | null;
  basin: string;
  movement: string;
  last_update: string | null;
  lat: number | null;
  lon: number | null;
  public_advisory_url: string | null;
  forecast_url: string | null;
}

export interface NhcStormsData {
  active: NhcStorm[];
  count: number;
  season_note: string | null;
}

const ENDPOINT = '/api/nhc-storms';
const CACHE_KEY = 'nhc-storms';
const POLL_MS = 15 * 60_000;

export function useNhcStorms(): NhcStormsData | null {
  const [data, setData] = useState<NhcStormsData | null>(() => getCache<NhcStormsData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: NhcStormsData | undefined = json?.data;
        if (!d || !Array.isArray(d.active)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'nhc-storms');
      } catch (e) { if (import.meta.env.DEV) console.warn('[NHC]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
