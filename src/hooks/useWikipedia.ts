import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface WikiArticle {
  title: string;
  extract: string;
  thumbnail: string;
  url: string;
}

const CACHE_KEY = 'wikipedia_featured';
const POLL_MS = 60 * 60_000; // 1 hour

export function useWikipedia(): WikiArticle | null {
  const [article, setArticle] = useState<WikiArticle | null>(() => {
    return getCache<WikiArticle>(CACHE_KEY)?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        // worker proxy (wikimedia featured), rule #6: worker computes the date
        // and returns a normalized { data: { featured_article: {...} } } shape.
        const res = await fetch('/api/wiki-featured', { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const fa = json.data?.featured_article;
        if (!fa || !fa.title) return;

        const result: WikiArticle = {
          title: fa.title,
          extract: (fa.extract || '').slice(0, 200),
          thumbnail: fa.thumbnail || '',
          url: fa.url || `https://en.wikipedia.org/wiki/${encodeURIComponent(fa.title)}`,
        };

        setArticle(result);
        setCache(CACHE_KEY, result, 'wikipedia');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Wikipedia]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return article;
}
