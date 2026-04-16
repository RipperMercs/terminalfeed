import { useEffect, useState, useRef } from 'react';

export interface FearGreedData {
  value: number;
  label: string;
  timestamp: number;
}

const API_URL = 'https://api.alternative.me/fng/?limit=1';
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
        const entry = json.data?.[0];
        if (!entry || !mountedRef.current) return;
        setData({
          value: parseInt(entry.value, 10),
          label: entry.value_classification,
          timestamp: parseInt(entry.timestamp, 10) * 1000,
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[FearGreed]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
