// US Congress: bills at the President's desk + most-viewed bills.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface PresentedBill {
  title: string;
  description: string;
  link: string | null;
  pubDate: string | null;
}

export interface MostViewedBill {
  bill_id: string;
  url: string;
  title: string;
}

export interface CongressData {
  presented_to_president: PresentedBill[];
  most_viewed_bills: MostViewedBill[];
}

const ENDPOINT = '/api/congress';
const CACHE_KEY = 'congress';
const POLL_MS = 30 * 60_000;

export function useCongress(): CongressData | null {
  const [data, setData] = useState<CongressData | null>(() => getCache<CongressData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: CongressData | undefined = json?.data;
        if (!d) return;
        setData(d);
        setCache(CACHE_KEY, d, 'congress');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Congress]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
