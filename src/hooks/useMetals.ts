import { useState, useEffect, useRef } from 'react';

export interface MetalPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const API_URL = '/api/coingecko/gold';
const POLL_MS = 180_000;

export function useMetals() {
  const [metals, setMetals] = useState<MetalPrice[]>([
    { symbol: 'XAU', name: 'Gold', price: 0, change: 0 },
  ]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchPrices = async () => {
      if (!mountedRef.current) return;

      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current) return;
        const list = Array.isArray(json.data) ? json.data : [];
        const gold = list[0];
        if (gold && (gold.current_price ?? 0) > 0) {
          setMetals([
            {
              symbol: 'XAU',
              name: 'Gold',
              price: gold.current_price,
              change: gold.price_change_percentage_24h ?? 0,
            },
          ]);
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[Metals]', e); }
    };

    fetchPrices();
    const id = setInterval(fetchPrices, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return metals;
}
