import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface ApodData {
  title: string;
  explanation: string;
  url: string;
  hdurl: string;
  date: string;
  mediaType: string;
  copyright: string;
}

const API_URL = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';
const CACHE_KEY = 'nasa_apod';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useNasaApod(): ApodData | null {
  const [data, setData] = useState<ApodData | null>(() => {
    const cached = getCache<ApodData>(CACHE_KEY);
    if (cached?.data && cached.data.date === todayKey()) return cached.data;
    return null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (data?.date === todayKey()) return;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!json.title || !mountedRef.current) return;

        const result: ApodData = {
          title: json.title,
          explanation: json.explanation ?? '',
          url: json.url ?? '',
          hdurl: json.hdurl ?? json.url ?? '',
          date: json.date ?? todayKey(),
          mediaType: json.media_type ?? 'image',
          copyright: json.copyright ?? '',
        };

        setData(result);
        setCache(CACHE_KEY, result, 'nasa');
      } catch {}
    };

    fetch_();
    return () => { mountedRef.current = false; };
  }, [data]);

  return data;
}
