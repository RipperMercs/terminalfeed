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
        const now = new Date();
        const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const data = await res.json();
        const tfa = data.tfa;
        if (!tfa) return;

        const result: WikiArticle = {
          title: tfa.normalizedtitle || tfa.title || '',
          extract: (tfa.extract || '').slice(0, 200),
          thumbnail: tfa.thumbnail?.source || '',
          url: tfa.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${tfa.title}`,
        };

        setArticle(result);
        setCache(CACHE_KEY, result, 'wikipedia');
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return article;
}
