// OpenPhish verified phishing URL feed + brand-target aggregation.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface PhishingUrl {
  url: string;
  host: string | null;
  brand_target: string | null;
}

export interface PhishingBrandCount {
  brand: string;
  count: number;
}

export interface PhishingData {
  total_in_feed: number;
  recent: PhishingUrl[];
  top_brand_targets: PhishingBrandCount[];
}

const ENDPOINT = '/api/phishing';
const CACHE_KEY = 'phishing';
const POLL_MS = 60 * 60_000;

export function usePhishing(): PhishingData | null {
  const [data, setData] = useState<PhishingData | null>(() => getCache<PhishingData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(10000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: PhishingData | undefined = json?.data;
        if (!d || !Array.isArray(d.recent)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'phishing');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Phishing]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
