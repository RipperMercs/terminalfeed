import { useState, useEffect, useRef } from 'react';

export interface MetalPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const POLL_MS = 60_000;

export function useMetals() {
  const [metals, setMetals] = useState<MetalPrice[]>([
    { symbol: 'XAU', name: 'Gold', price: 0, change: 0 },
    { symbol: 'XAG', name: 'Silver', price: 0, change: 0 },
  ]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchPrices = async () => {
      if (!mountedRef.current) return;

      // PAX Gold (1:1 gold-backed token) for gold price
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=pax-gold&sparkline=false',
        );
        if (res.ok) {
          const [gold] = await res.json();
          if (gold && mountedRef.current) {
            setMetals((prev) => prev.map((m) =>
              m.symbol === 'XAU'
                ? { ...m, price: gold.current_price, change: gold.price_change_percentage_24h ?? 0 }
                : m,
            ));
          }
        }
      } catch {}

      // Silver via Lode Silver token
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=lode-silver&sparkline=false',
        );
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0 && mountedRef.current) {
            setMetals((prev) => prev.map((m) =>
              m.symbol === 'XAG'
                ? { ...m, price: data[0].current_price, change: data[0].price_change_percentage_24h ?? 0 }
                : m,
            ));
          }
        }
      } catch {}
    };

    fetchPrices();
    const id = setInterval(fetchPrices, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return metals;
}
