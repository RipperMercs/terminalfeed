// FDA enforcement actions (food + drug + device) from last 30 days, sorted
// by report_date desc. Worker aggregates the three openFDA endpoints.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface FdaRecall {
  category: 'food' | 'drug' | 'device' | string;
  product: string;
  reason: string;
  classification: string;          // 'Class I' | 'Class II' | 'Class III'
  firm: string;
  voluntary: boolean;
  state: string;
  country: string;
  report_date: string;             // YYYY-MM-DD
  recall_initiation_date: string;
  status: string;
}

export interface FdaRecallsData {
  recent: FdaRecall[];
  window: string;
  by_class: { 'Class I'?: number; 'Class II'?: number; 'Class III'?: number };
  by_category: { food?: number; drug?: number; device?: number };
}

const ENDPOINT = '/api/openfda-recalls';
const CACHE_KEY = 'openfda-recalls';
const POLL_MS = 6 * 60 * 60_000;   // 6h to match Worker cache

export function useOpenFdaRecalls(): FdaRecallsData | null {
  const [data, setData] = useState<FdaRecallsData | null>(() => getCache<FdaRecallsData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(10000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: FdaRecallsData | undefined = json?.data;
        if (!d || !Array.isArray(d.recent)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'openfda-recalls');
      } catch (e) { if (import.meta.env.DEV) console.warn('[FDA]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
