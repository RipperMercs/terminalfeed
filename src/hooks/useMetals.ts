import { useState, useEffect, useRef } from 'react';

export interface MetalPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

// Commodity-backed tokens on CoinGecko that track real spot prices
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=pax-gold,tether-gold&sparkline=false';

const POLL_MS = 60_000;

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
        const res = await fetch(COINGECKO_URL);
        if (!res.ok) return;
        const data = await res.json();
        if (!mountedRef.current) return;

        // Use pax-gold as primary, tether-gold as fallback
        const gold = data.find((c: any) => c.id === 'pax-gold') ||
                     data.find((c: any) => c.id === 'tether-gold');

        if (gold) {
          setMetals([
            {
              symbol: 'XAU',
              name: 'Gold',
              price: gold.current_price,
              change: gold.price_change_percentage_24h ?? 0,
            },
          ]);
        }
      } catch {}
    };

    fetchPrices();
    const id = setInterval(fetchPrices, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return metals;
}
