import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface PHProduct {
  title: string;
  link: string;
  pubDate: string;
}

const RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://www.producthunt.com/feed');
const CACHE_KEY = 'producthunt';
const POLL_MS = 10 * 60_000; // 10 min

export function useProductHunt(): PHProduct[] {
  const [products, setProducts] = useState<PHProduct[]>(() => {
    return getCache<PHProduct[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(RSS_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const data = await res.json();
        if (!data.items?.length) return;

        const results: PHProduct[] = data.items.slice(0, 8).map((item: { title: string; link: string; pubDate: string }) => ({
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || '',
        }));

        setProducts(results);
        setCache(CACHE_KEY, results, 'producthunt');
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return products;
}
