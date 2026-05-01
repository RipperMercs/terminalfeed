import { useState, useEffect, useRef } from 'react';

export interface WildfireDetection {
  lat: number;
  lon: number;
  frpMw: number;
  confidence: string;
  acqDate: string;
  acqTime: string;
  approxState: string;
  satellite: string;
}

export interface WildfiresData {
  total24h: number;
  top: WildfireDetection[];
  error: string | null;
  updatedAt: string;
}

const POLL_MS = 10 * 60_000;
const MOBILE_POLL_MS = 20 * 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useWildfires() {
  const [data, setData] = useState<WildfiresData | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/wildfires', { signal: AbortSignal.timeout(12000) });
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        if (!mountedRef.current || !d) return;
        setData({
          total24h: d.total_24h ?? 0,
          top: Array.isArray(d.top) ? d.top.slice(0, 25).map((row: Record<string, unknown>) => ({
            lat: typeof row.lat === 'number' ? row.lat : 0,
            lon: typeof row.lon === 'number' ? row.lon : 0,
            frpMw: typeof row.frp_mw === 'number' ? row.frp_mw : 0,
            confidence: typeof row.confidence === 'string' ? row.confidence : '',
            acqDate: typeof row.acq_date === 'string' ? row.acq_date : '',
            acqTime: typeof row.acq_time === 'string' ? row.acq_time : '',
            approxState: typeof row.approx_state === 'string' ? row.approx_state : 'OTHER',
            satellite: typeof row.satellite === 'string' ? row.satellite : '',
          })) : [],
          error: typeof d.error === 'string' ? d.error : null,
          updatedAt: json?.updated_at ?? '',
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[Wildfires]', e); }
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
