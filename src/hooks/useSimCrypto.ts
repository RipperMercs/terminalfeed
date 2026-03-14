import { useState, useEffect } from 'react';

interface CryptoItem {
  symbol: string;
  price: number;
  change: number;
}

const INITIAL: CryptoItem[] = [
  { symbol: 'ETH', price: 3842.15, change: 1.23 },
  { symbol: 'SOL', price: 178.44, change: 4.56 },
  { symbol: 'DOGE', price: 0.1823, change: -2.11 },
  { symbol: 'XRP', price: 2.34, change: 0.78 },
  { symbol: 'ADA', price: 0.89, change: -0.45 },
];

export function useSimCrypto() {
  const [crypto, setCrypto] = useState(INITIAL);

  useEffect(() => {
    const id = setInterval(() => {
      setCrypto((prev) =>
        prev.map((c) => ({
          ...c,
          price: Math.max(0.001, c.price + (Math.random() - 0.48) * c.price * 0.002),
          change: c.change + (Math.random() - 0.48) * 0.1,
        })),
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return crypto;
}
