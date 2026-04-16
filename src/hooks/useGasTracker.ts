import { useState, useEffect, useRef } from 'react';

export interface GasData {
  low: number;
  standard: number;
  fast: number;
  baseFee: number;
  lastBlock: number;
  ts: number;
}

const POLL_MS = 15_000;

export function useGasTracker() {
  const [gas, setGas] = useState<GasData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    let cancelled = false;

    const fetchGas = async () => {
      try {
        const res = await fetch('/api/gas', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setGas(data);
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

  return gas;
}
