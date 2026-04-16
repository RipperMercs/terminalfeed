import { useState, useEffect, useRef } from 'react';

export interface MemeToken {
  name: string;
  symbol: string;
  chain: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  pairUrl: string;
}

const POLL_MS = 60_000;

export function useMemecoinRadar() {
  const [tokens, setTokens] = useState<MemeToken[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    let cancelled = false;

    const fetchMemes = async () => {
      try {
        const res = await fetch('/api/meme-radar', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setTokens(data.slice(0, 8));
      } catch (e) { if (import.meta.env.DEV) console.warn('[MemecoinRadar]', e); }
    };

    fetchMemes();
    intervalRef.current = setInterval(fetchMemes, POLL_MS);

    const onVisChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchMemes();
        intervalRef.current = setInterval(fetchMemes, POLL_MS);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return tokens;
}
