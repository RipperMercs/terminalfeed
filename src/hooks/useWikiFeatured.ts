// Today's Wikipedia featured article + image of the day + current news.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface WikiNewsLink {
  title: string;
  url: string | null;
}

export interface WikiNewsStory {
  story: string;
  links: WikiNewsLink[];
}

export interface WikiFeaturedData {
  featured_article: {
    title: string;
    extract: string;
    thumbnail: string | null;
    url: string | null;
  };
  image_of_day: {
    title: string;
    description: string;
    thumbnail: string | null;
    url: string | null;
  };
  news: WikiNewsStory[];
  on_this_day_count: number;
  date: string;
}

const ENDPOINT = '/api/wiki-featured';
const CACHE_KEY = 'wiki-featured';
const POLL_MS = 6 * 60 * 60_000;

export function useWikiFeatured(): WikiFeaturedData | null {
  const [data, setData] = useState<WikiFeaturedData | null>(() => getCache<WikiFeaturedData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: WikiFeaturedData | undefined = json?.data;
        if (!d || !d.featured_article) return;
        setData(d);
        setCache(CACHE_KEY, d, 'wiki-featured');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Wiki]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
