// USGS HANS live US volcano alerts: aviation color codes + alert levels.
// Worker-proxied (/api/volcano-alerts), KV-cached. An empty list is the valid
// all-clear state, not an error.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface VolcanoAlert {
  volcano: string;
  vnum: string;
  color: string;            // GREEN | YELLOW | ORANGE | RED
  alert: string;            // NORMAL | ADVISORY | WATCH | WARNING
  obs: string;              // observatory abbr (AVO/HVO/...)
  sent_unixtime: number | null;
  url: string;
}

export interface VolcanoAlertData {
  count: number;
  elevated: VolcanoAlert[];
  all_clear: boolean;
  source: string;
}

const ENDPOINT = '/api/volcano-alerts';
const CACHE_KEY = 'volcano-alerts';
const POLL_MS = 20 * 60_000;

export function useVolcanoAlerts(): VolcanoAlertData | null {
  const [data, setData] = useState<VolcanoAlertData | null>(() => getCache<VolcanoAlertData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: VolcanoAlertData | undefined = json?.data;
        if (!d || !Array.isArray(d.elevated)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'volcano-alerts');
      } catch (e) { if (import.meta.env.DEV) console.warn('[VolcanoAlerts]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
