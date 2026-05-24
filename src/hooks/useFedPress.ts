// Federal Reserve press releases (FOMC actions, speeches, enforcements).

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface FedPressItem {
  title: string;
  link: string | null;
  pub_date: string | null;
  summary: string;
}

const ENDPOINT = '/api/fed-press';
const CACHE_KEY = 'fed-press';
const POLL_MS = 60 * 60_000;

export function useFedPress(): FedPressItem[] {
  const [items, setItems] = useState<FedPressItem[]>(() => getCache<FedPressItem[]>(CACHE_KEY)?.data ?? []);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const arr: FedPressItem[] = Array.isArray(json?.data) ? json.data : [];
        if (arr.length === 0) return;
        setItems(arr);
        setCache(CACHE_KEY, arr, 'fed-press');
      } catch (e) { if (import.meta.env.DEV) console.warn('[FedPress]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return items;
}
