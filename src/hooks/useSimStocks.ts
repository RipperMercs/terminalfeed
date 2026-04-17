import { useState, useEffect, useRef } from 'react';
import { setCache, getCache } from '../services/cache';
import { STATIC_FALLBACKS } from '../data/staticFallbacks';

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const POLL_MS = 30000;
const POLL_MS_MOBILE = 60000;

const DEFAULT_SYMBOLS: { symbol: string; name: string }[] = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'NASDAQ' },
  { symbol: 'DIA', name: 'DOW' },
  { symbol: 'IWM', name: 'Russell 2000' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Google' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'AMD', name: 'AMD' },
  { symbol: 'COIN', name: 'Coinbase' },
  { symbol: 'PLTR', name: 'Palantir' },
  { symbol: 'MSTR', name: 'MicroStrategy' },
  { symbol: 'SMCI', name: 'Super Micro' },
  { symbol: 'AVGO', name: 'Broadcom' },
  { symbol: 'CRM', name: 'Salesforce' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'SQ', name: 'Block' },
  { symbol: 'SHOP', name: 'Shopify' },
  { symbol: 'HOOD', name: 'Robinhood' },
  { symbol: 'SOFI', name: 'SoFi' },
  { symbol: 'MARA', name: 'Marathon Digital' },
  { symbol: 'RIOT', name: 'Riot Platforms' },
  { symbol: 'UBER', name: 'Uber' },
  { symbol: 'ARM', name: 'ARM Holdings' },
  { symbol: 'SNOW', name: 'Snowflake' },
  { symbol: 'RBLX', name: 'Roblox' },
  { symbol: 'RIVN', name: 'Rivian' },
];

export const INDICES = ['SPY', 'QQQ', 'DIA', 'IWM'];

interface WorkerQuote {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  prev_close?: number;
}

export function useSimStocks(customSymbols: string[] = []) {
  const SYMBOLS = [
    ...DEFAULT_SYMBOLS,
    ...customSymbols
      .filter((s) => !DEFAULT_SYMBOLS.some((d) => d.symbol === s))
      .map((s) => ({ symbol: s, name: '' })),
  ];

  const [stocks, setStocks] = useState<StockItem[]>(() => {
    const cached = getCache<StockItem[]>('stock_prices');
    if (cached) return cached.data;
    return SYMBOLS.map((s) => {
      const fb = STATIC_FALLBACKS.stocks.find((f) => f.symbol === s.symbol);
      return fb ? { ...fb } : { ...s, price: 0, change: 0 };
    });
  });

  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const symbolsCsv = SYMBOLS.map((s) => s.symbol).join(',');

  useEffect(() => {
    mountedRef.current = true;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const pollMs = isMobile ? POLL_MS_MOBILE : POLL_MS;

    const fetchQuotes = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch(`/api/stocks?symbols=${symbolsCsv}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: WorkerQuote[] };
        if (!mountedRef.current) return;
        const quotes = Array.isArray(json.data) ? json.data : [];
        if (quotes.length === 0) return;

        const quoteMap: Record<string, WorkerQuote> = {};
        for (const q of quotes) {
          if (q && q.symbol && (q.price ?? 0) > 0) quoteMap[q.symbol] = q;
        }

        setStocks((prev) => {
          const next = prev.map((s) => {
            const q = quoteMap[s.symbol];
            if (!q) return s;
            const prevClose = q.prev_close ?? 0;
            const change = prevClose > 0
              ? ((q.price - prevClose) / prevClose) * 100
              : q.change_percent ?? 0;
            return { ...s, price: q.price, change };
          });
          setCache('stock_prices', next, 'worker');
          return next;
        });
      } catch { /* swallow — keep last known values */ }
    };

    fetchQuotes();
    intervalRef.current = setInterval(fetchQuotes, pollMs);

    const onVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (!intervalRef.current) {
        fetchQuotes();
        intervalRef.current = setInterval(fetchQuotes, pollMs);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [symbolsCsv]);

  return stocks;
}
