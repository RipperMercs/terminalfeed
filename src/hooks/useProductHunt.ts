import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface PHProduct {
  title: string;        // legacy field - now the product name only
  tagline: string;
  link: string;
  pubDate: string;
}

const ENDPOINT = '/api/producthunt';
const CACHE_KEY = 'producthunt';
const POLL_MS = 60 * 60_000; // 1h; matches Worker cache TTL

export function useProductHunt(): PHProduct[] {
  const [products, setProducts] = useState<PHProduct[]>(() => {
    return getCache<PHProduct[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const arr: { name?: string; tagline?: string; url?: string; published?: string }[] = json?.data ?? [];
        if (arr.length === 0) return;

        const results: PHProduct[] = arr.slice(0, 8).map(item => ({
          title: item.name || '',
          tagline: item.tagline || '',
          link: item.url || '',
          pubDate: item.published || '',
        }));

        setProducts(results);
        setCache(CACHE_KEY, results, 'producthunt');
      } catch (e) { if (import.meta.env.DEV) console.warn('[ProductHunt]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return products;
}
