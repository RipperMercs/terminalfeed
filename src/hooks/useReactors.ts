// NRC power reactor status: every US commercial reactor's power level from the
// daily report. Worker-proxied (/api/reactors), KV-cached, refreshed ~6h
// server-side (the source file is daily).

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface ReactorUnit { unit: string; power: number; }

export interface ReactorsData {
  report_date: string;
  total: number;
  at_full_power: number;
  reduced: ReactorUnit[];
  offline: ReactorUnit[];
  reduced_count: number;
  offline_count: number;
}

const ENDPOINT = '/api/reactors';
const CACHE_KEY = 'reactors';
const POLL_MS = 30 * 60_000;

export function useReactors(): ReactorsData | null {
  const [data, setData] = useState<ReactorsData | null>(() => getCache<ReactorsData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: ReactorsData | undefined = json?.data;
        if (!d || !Array.isArray(d.reduced) || !(d.total > 0)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'nrc');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Reactors]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
