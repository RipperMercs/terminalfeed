import { useState, useEffect, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface ApodData {
  title: string;
  url: string;
  hdurl: string;
  explanation: string;
  date: string;
  media_type: string;
  copyright?: string;
}

const CACHE_KEY = 'nasa_apod';
const REFRESH_MS = 60 * 60_000; // 1 hour

export function useNasaApod() {
  const [apod, setApod] = useState<ApodData | null>(() => {
    const cached = getCache<ApodData>(CACHE_KEY);
    if (cached?.data && cached.age < REFRESH_MS) return cached.data;
    return null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchApod = async () => {
      try {
        const res = await fetch('/api/nasa-apod', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const data = await res.json();
        if (!mountedRef.current || data.error) return;
        const item: ApodData = {
          title: data.title ?? '',
          url: data.url ?? '',
          hdurl: data.hdurl ?? data.url ?? '',
          explanation: data.explanation ?? '',
          date: data.date ?? '',
          media_type: 'image',
          copyright: data.copyright,
        };
        setApod(item);
        setCache(CACHE_KEY, item, 'nasa-apod');
      } catch (e) { if (import.meta.env.DEV) console.warn('[NasaApod]', e); }
    };

    const cached = getCache<ApodData>(CACHE_KEY);
    if (!cached?.data || cached.age >= REFRESH_MS) {
      const timer = setTimeout(fetchApod, 3000);
      const id = setInterval(fetchApod, REFRESH_MS);
      return () => { mountedRef.current = false; clearTimeout(timer); clearInterval(id); };
    }

    const id = setInterval(fetchApod, REFRESH_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return apod;
}
