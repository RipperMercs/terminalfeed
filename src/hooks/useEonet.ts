import { useState, useEffect, useRef } from 'react';

export interface EonetCategory {
  id: string;
  title: string;
  glyph: string;
  count: number;
}

export interface EonetEvent {
  id: string;
  title: string;
  categoryId: string;
  categoryTitle: string;
  glyph: string;
  date: string | null;
  lon: number | null;
  lat: number | null;
  link: string | null;
}

export interface EonetData {
  totalOpen: number;
  categories: EonetCategory[];
  recent: EonetEvent[];
}

const POLL_MS = 5 * 60_000;
const MOBILE_POLL_MS = 10 * 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useEonet() {
  const [data, setData] = useState<EonetData | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/eonet', { signal: AbortSignal.timeout(10000) });
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        if (!mountedRef.current || !d) return;
        setData({
          totalOpen: typeof d.total_open === 'number' ? d.total_open : 0,
          categories: Array.isArray(d.categories) ? d.categories.map((c: Record<string, unknown>) => ({
            id: typeof c.id === 'string' ? c.id : '',
            title: typeof c.title === 'string' ? c.title : '',
            glyph: typeof c.glyph === 'string' ? c.glyph : '•',
            count: typeof c.count === 'number' ? c.count : 0,
          })) : [],
          recent: Array.isArray(d.recent) ? d.recent.map((e: Record<string, unknown>) => ({
            id: typeof e.id === 'string' ? e.id : '',
            title: typeof e.title === 'string' ? e.title : '',
            categoryId: typeof e.category_id === 'string' ? e.category_id : '',
            categoryTitle: typeof e.category_title === 'string' ? e.category_title : '',
            glyph: typeof e.glyph === 'string' ? e.glyph : '•',
            date: typeof e.date === 'string' ? e.date : null,
            lon: typeof e.lon === 'number' ? e.lon : null,
            lat: typeof e.lat === 'number' ? e.lat : null,
            link: typeof e.link === 'string' ? e.link : null,
          })) : [],
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[Eonet]', e); }
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
