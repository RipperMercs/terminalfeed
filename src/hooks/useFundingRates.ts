import { useState, useEffect, useRef } from 'react';

export interface FundingRow {
  venue: string;
  symbol: string;
  periodHours: number;
  periodRate: number;
  annualizedPct: number;
  nextFundingTime: number | null;
  markPrice: number | null;
}

export interface FundingRatesData {
  top: FundingRow[];
  failedVenues: string[];
  updatedAt: string;
}

const POLL_MS = 60_000;
const MOBILE_POLL_MS = 120_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useFundingRates() {
  const [data, setData] = useState<FundingRatesData | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/funding-rates', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        if (!mountedRef.current || !d) return;
        setData({
          top: Array.isArray(d.top) ? d.top.slice(0, 20).map((row: Record<string, unknown>) => ({
            venue: typeof row.venue === 'string' ? row.venue : '',
            symbol: typeof row.symbol === 'string' ? row.symbol : '',
            periodHours: typeof row.periodHours === 'number' ? row.periodHours : 8,
            periodRate: typeof row.periodRate === 'number' ? row.periodRate : 0,
            annualizedPct: typeof row.annualizedPct === 'number' ? row.annualizedPct : 0,
            nextFundingTime: typeof row.nextFundingTime === 'number' ? row.nextFundingTime : null,
            markPrice: typeof row.markPrice === 'number' ? row.markPrice : null,
          })) : [],
          failedVenues: Array.isArray(d.failed_venues) ? d.failed_venues : [],
          updatedAt: json?.updated_at ?? '',
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[FundingRates]', e); }
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
