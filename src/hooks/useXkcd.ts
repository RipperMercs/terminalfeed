import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface XkcdComic {
  num: number;
  title: string;
  img: string;
  alt: string;
  year: string;
  month: string;
  day: string;
}

const API_URL = 'https://xkcd.com/info.0.json';
const CACHE_KEY = 'xkcd_latest';
const POLL_MS = 300_000; // 5 minutes — comics update infrequently

export function useXkcd() {
  const [comic, setComic] = useState<XkcdComic | null>(() => {
    const cached = getCache<XkcdComic>(CACHE_KEY);
    return cached?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchComic = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current) return;

        const result: XkcdComic = {
          num: json.num,
          title: json.title || json.safe_title,
          img: json.img,
          alt: json.alt,
          year: json.year,
          month: json.month,
          day: json.day,
        };

        setComic(result);
        setCache(CACHE_KEY, result, 'xkcd');
      } catch {}
    };

    fetchComic();
    const id = setInterval(fetchComic, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return comic;
}
