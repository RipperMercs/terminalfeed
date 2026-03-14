import { useState, useEffect } from 'react';

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const INITIAL: StockItem[] = [
  { symbol: 'SPY', name: 'S&P 500', price: 5892.41, change: 0.67 },
  { symbol: 'QQQ', name: 'NASDAQ', price: 20548.12, change: 1.12 },
  { symbol: 'DIA', name: 'DOW', price: 43210.55, change: -0.23 },
  { symbol: 'NVDA', name: 'NVIDIA', price: 142.87, change: 3.45 },
  { symbol: 'MSFT', name: 'Microsoft', price: 468.22, change: 0.89 },
  { symbol: 'AAPL', name: 'Apple', price: 234.56, change: -0.34 },
];

export function useSimStocks() {
  const [stocks, setStocks] = useState(INITIAL);

  useEffect(() => {
    const id = setInterval(() => {
      setStocks((prev) =>
        prev.map((s) => ({
          ...s,
          price: s.price + (Math.random() - 0.48) * s.price * 0.001,
          change: s.change + (Math.random() - 0.48) * 0.08,
        })),
      );
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return stocks;
}
