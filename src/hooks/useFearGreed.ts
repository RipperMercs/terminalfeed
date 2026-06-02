import { useEffect, useState, useRef } from 'react';

export interface FearGreedData {
  value: number;
  label: string;
  timestamp: number;
}

const API_URL = '/api/fear-greed'; // worker proxy (alternative.me), rule #6
const POLL_MS = 2 * 60_000; // 2 min

export function useFearGreed() {
  const [data, setData] = useState<FearGreedData | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) return;
        const json = await res.json();
        // Worker returns { data: { value:number, label, timestamp:seconds } }.
        const entry = json.data;
        if (!entry || typeof entry.value !== 'number' || !mountedRef.current) return;
        setData({
          value: entry.value,
          label: entry.label,
          timestamp: entry.timestamp ? Number(entry.timestamp) * 1000 : Date.now(),
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[FearGreed]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
