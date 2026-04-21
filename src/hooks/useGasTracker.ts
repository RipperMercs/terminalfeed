import { useState, useEffect, useRef } from 'react';

export interface GasData {
  low: number;
  standard: number;
  fast: number;
  baseFee: number;
  lastBlock: number;
  ts: number;
}

export type GasTrend = 'up' | 'down' | 'flat' | null;

export interface GasTrackerResult {
  gas: GasData | null;
  trend: GasTrend;
}

const POLL_MS = 15_000;
// ~5 min of samples at 15s polling
const HISTORY_WINDOW = 20;
// Minimum gwei delta before calling it a trend (not noise)
const TREND_THRESHOLD = 1;

export function useGasTracker(): GasTrackerResult {
  const [gas, setGas] = useState<GasData | null>(null);
  const [trend, setTrend] = useState<GasTrend>(null);
  const historyRef = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    let cancelled = false;

    const fetchGas = async () => {
      try {
        const res = await fetch('/api/gas', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const data: GasData = await res.json();
        if (cancelled) return;
        setGas(data);

        const hist = historyRef.current;
        hist.push(data.standard ?? 0);
        if (hist.length > HISTORY_WINDOW) hist.shift();

        if (hist.length >= 3) {
          const oldest = hist[0];
          const current = hist[hist.length - 1];
          const delta = current - oldest;
          if (delta > TREND_THRESHOLD) setTrend('up');
          else if (delta < -TREND_THRESHOLD) setTrend('down');
          else setTrend('flat');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[GasTracker]', e); }
    };

    fetchGas();
    intervalRef.current = setInterval(fetchGas, POLL_MS);

    const onVisChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchGas();
        intervalRef.current = setInterval(fetchGas, POLL_MS);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return { gas, trend };
}
