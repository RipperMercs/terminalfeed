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

const API_BASE = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';
const CACHE_KEY = 'nasa_apod';
const REFRESH_MS = 60 * 60_000; // 1 hour
const MAX_LOOKBACK = 5; // try up to 5 days back to find an image

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

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
        const today = new Date();
        for (let i = 0; i < MAX_LOOKBACK; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const url = `${API_BASE}&date=${formatDate(d)}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) continue;
          const data = await res.json();
          if (!mountedRef.current) return;
          if (data.media_type !== 'image') continue;
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
          return;
        }
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
