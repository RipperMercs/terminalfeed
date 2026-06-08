import { useState, useEffect, useRef } from 'react';
import { setCache, getCache } from '../services/cache';
import { STATIC_FALLBACKS } from '../data/staticFallbacks';

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  // True when this quote was not refreshed this cycle (absent from the API
  // response, or the API flagged it past its freshness window). Drives the
  // per-symbol "stale" treatment so a frozen value is never shown as live.
  stale?: boolean;
}

// A localStorage seed older than this is shown dimmed/stale until the first
// live fetch lands (which happens on mount, so this is a brief safety net).
const SEED_STALE_MS = 10 * 60 * 1000;

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
  { symbol: 'CRCL', name: 'Circle' },
  { symbol: 'PLTR', name: 'Palantir' },
  { symbol: 'MSTR', name: 'MicroStrategy' },
  { symbol: 'SMCI', name: 'Super Micro' },
  { symbol: 'AVGO', name: 'Broadcom' },
  { symbol: 'CRM', name: 'Salesforce' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'XYZ', name: 'Block' },
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
  stale?: boolean;
  age_seconds?: number;
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
    const cachedBySymbol: Record<string, StockItem> = {};
    // A cache older than SEED_STALE_MS is shown stale until the first live fetch.
    const seedStale = cached ? cached.age > SEED_STALE_MS : false;
    if (cached) {
      for (const c of cached.data) cachedBySymbol[c.symbol] = c;
    }
    return SYMBOLS.map((s) => {
      const c = cachedBySymbol[s.symbol];
      if (c) return { ...c, stale: seedStale || !!c.stale };
      // Static fallbacks are last-resort placeholders: always flag them stale.
      const fb = STATIC_FALLBACKS.stocks.find((f) => f.symbol === s.symbol);
      return fb ? { ...fb, stale: true } : { ...s, price: 0, change: 0, stale: false };
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
          const prevBySymbol: Record<string, StockItem> = {};
          for (const p of prev) prevBySymbol[p.symbol] = p;
          const next = SYMBOLS.map((sym) => {
            const existing = prevBySymbol[sym.symbol] ?? { ...sym, price: 0, change: 0 };
            const q = quoteMap[sym.symbol];
            // Not in this response: keep the last value but flag it stale (only
            // meaningful once we actually had data, i.e. price > 0).
            if (!q) return { ...existing, stale: (existing.price ?? 0) > 0 };
            const prevClose = q.prev_close ?? 0;
            const change = prevClose > 0
              ? ((q.price - prevClose) / prevClose) * 100
              : q.change_percent ?? 0;
            return { ...existing, price: q.price, change, stale: !!q.stale };
          });
          setCache('stock_prices', next, 'worker');
          return next;
        });
      } catch { /* swallow: keep last known values */ }
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
