// Active anomaly signals from the Worker's cron detector (/api/signals):
// which real-time feeds are having a big day right now. Empty on quiet days,
// and the strip renders nothing.

import { useEffect, useRef, useState } from 'react';

export type SignalSeverity = 'notice' | 'elevated' | 'critical';

export interface Signal {
  id: string;
  panel: string;
  severity: SignalSeverity;
  label: string;
  since: number;
}

const ENDPOINT = '/api/signals';
const POLL_MS = 2 * 60_000;

export function useSignals(): Signal[] {
  const [signals, setSignals] = useState<Signal[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const list = json?.data?.signals;
        if (!Array.isArray(list)) return;
        setSignals(list.filter((s: Signal) => s && s.label && s.panel).slice(0, 8));
      } catch (e) { if (import.meta.env.DEV) console.warn('[Signals]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return signals;
}
