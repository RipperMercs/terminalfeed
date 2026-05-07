import { useState, useEffect, useRef } from 'react';

// Yield curve maturities. Worker normalizes Treasury column names
// (bc_3month -> m3, bc_10year -> y10, etc.) so panel doesn't need to know.
export interface YieldCurve {
  m1: number | null;
  m3: number | null;
  m6: number | null;
  y1: number | null;
  y2: number | null;
  y3: number | null;
  y5: number | null;
  y7: number | null;
  y10: number | null;
  y20: number | null;
  y30: number | null;
}

export interface TreasuryYieldsData {
  recordDate: string;
  curve: YieldCurve;
  deltasBps: Partial<YieldCurve>;
  inverted2_10: boolean | null;
  spread2_10Bps: number | null;
}

const POLL_MS = 30 * 60_000; // 30m, Treasury publishes once per business day
const MOBILE_POLL_MS = 60 * 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useTreasuryYields() {
  const [data, setData] = useState<TreasuryYieldsData | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/treasury-yields', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        if (!mountedRef.current || !d || !d.curve) return;
        setData({
          recordDate: typeof d.record_date === 'string' ? d.record_date : '',
          curve: d.curve,
          deltasBps: d.deltas_bps ?? {},
          inverted2_10: d.inverted_2_10 ?? null,
          spread2_10Bps: d.spread_2_10_bps ?? null,
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[TreasuryYields]', e); }
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
