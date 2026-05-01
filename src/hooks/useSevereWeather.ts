import { useState, useEffect, useRef } from 'react';

export interface SevereAlert {
  event: string;
  severity: string;
  urgency: string;
  certainty: string;
  areaDesc: string;
  headline: string;
  effective: string;
  expires: string;
  category: string;
}

export interface SevereWeatherData {
  top: SevereAlert[];
  totalActive: number;
  countsBySeverity: Record<string, number>;
  updatedAt: string;
}

const POLL_MS = 60_000;
const MOBILE_POLL_MS = 120_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useSevereWeather() {
  const [data, setData] = useState<SevereWeatherData | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/severe-weather', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        if (!mountedRef.current || !d) return;
        setData({
          top: Array.isArray(d.top) ? d.top.slice(0, 15).map((row: Record<string, unknown>) => ({
            event: typeof row.event === 'string' ? row.event : 'Alert',
            severity: typeof row.severity === 'string' ? row.severity : 'Unknown',
            urgency: typeof row.urgency === 'string' ? row.urgency : 'Unknown',
            certainty: typeof row.certainty === 'string' ? row.certainty : 'Unknown',
            areaDesc: typeof row.area_desc === 'string' ? row.area_desc : '',
            headline: typeof row.headline === 'string' ? row.headline : '',
            effective: typeof row.effective === 'string' ? row.effective : '',
            expires: typeof row.expires === 'string' ? row.expires : '',
            category: typeof row.category === 'string' ? row.category : 'other',
          })) : [],
          totalActive: typeof d.total_active === 'number' ? d.total_active : 0,
          countsBySeverity: (d.counts_by_severity && typeof d.counts_by_severity === 'object') ? d.counts_by_severity : {},
          updatedAt: json?.updated_at ?? '',
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[SevereWeather]', e); }
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
