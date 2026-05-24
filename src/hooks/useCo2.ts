// Mauna Loa atmospheric CO2 concentration (daily).

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface Co2Data {
  latest_ppm: number;
  latest_date: string;
  change_vs_1y: number | null;
  change_vs_10y: number | null;
  change_vs_50y: number | null;
  change_vs_preindustrial: number;
  reference: {
    one_year_ago?: { date: string; ppm: number } | null;
    ten_years_ago?: { date: string; ppm: number } | null;
    fifty_years_ago?: { date: string; ppm: number } | null;
    preindustrial_baseline_ppm: number;
  };
  observation_count: number;
}

const ENDPOINT = '/api/co2';
const CACHE_KEY = 'co2';
const POLL_MS = 6 * 60 * 60_000;

export function useCo2(): Co2Data | null {
  const [data, setData] = useState<Co2Data | null>(() => getCache<Co2Data>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: Co2Data | undefined = json?.data;
        if (!d || typeof d.latest_ppm !== 'number') return;
        setData(d);
        setCache(CACHE_KEY, d, 'co2');
      } catch (e) { if (import.meta.env.DEV) console.warn('[CO2]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
