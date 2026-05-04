import { useState, useEffect, useRef } from 'react';

export interface VolcanoItem {
  name: string;
  country: string;
  title: string;
  pubDate: string;
  summary: string;
  link: string;
}

export interface VolcanoesData {
  count: number;
  items: VolcanoItem[];
  updatedAt: string;
}

const POLL_MS = 60 * 60_000;
const MOBILE_POLL_MS = 120 * 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useVolcanoes() {
  const [data, setData] = useState<VolcanoesData | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/volcanoes', { signal: AbortSignal.timeout(10000) });
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        if (!mountedRef.current || !d || !Array.isArray(d.items)) return;
        setData({
          count: typeof d.count === 'number' ? d.count : d.items.length,
          items: d.items.slice(0, 25).map((row: Record<string, unknown>) => ({
            name: typeof row.name === 'string' ? row.name : '',
            country: typeof row.country === 'string' ? row.country : '',
            title: typeof row.title === 'string' ? row.title : '',
            pubDate: typeof row.pub_date === 'string' ? row.pub_date : '',
            summary: typeof row.summary === 'string' ? row.summary : '',
            link: typeof row.link === 'string' ? row.link : '',
          })),
          updatedAt: json?.updated_at ?? '',
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[Volcanoes]', e); }
    };

    const poll = isMobile() ? MOBILE_POLL_MS : POLL_MS;
    fetchData();
    intervalRef.current = setInterval(fetchData, poll);

    const onVisChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchData();
        intervalRef.current = setInterval(fetchData, poll);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return data;
}
