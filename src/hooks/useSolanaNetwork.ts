import { useState, useEffect, useRef } from 'react';

export interface SolanaNetwork {
  tps: number;
  tpsAvg: number;
  slot: number;
  slotMs: number;
  epoch: number;
  epochProgress: number;
  ts: number;
}

const POLL_MS = 30_000;
const MOBILE_POLL_MS = 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useSolanaNetwork() {
  const [data, setData] = useState<SolanaNetwork | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchNet = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/solana-network', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current) return;

        setData({
          tps: json?.tps ?? 0,
          tpsAvg: json?.tpsAvg ?? 0,
          slot: json?.slot ?? 0,
          slotMs: json?.slotMs ?? 0,
          epoch: json?.epoch ?? 0,
          epochProgress: json?.epochProgress ?? 0,
          ts: json?.ts ?? Date.now(),
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[SolanaNetwork]', e); }
    };

    const poll = isMobile() ? MOBILE_POLL_MS : POLL_MS;
    fetchNet();
    intervalRef.current = setInterval(fetchNet, poll);

    const onVisChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchNet();
        intervalRef.current = setInterval(fetchNet, poll);
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
