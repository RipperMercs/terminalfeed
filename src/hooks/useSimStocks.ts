import { useState, useEffect, useRef, useCallback } from 'react';
import { setCache, getCache } from '../services/cache';
import { STATIC_FALLBACKS } from '../data/staticFallbacks';

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const FINNHUB_KEY = 'd6qig99r01qhcrmkbj4gd6qig99r01qhcrmkbj50';
const FINNHUB_WS = `wss://ws.finnhub.io?token=${FINNHUB_KEY}`;
const FINNHUB_REST = 'https://finnhub.io/api/v1/quote';
const RECONNECT_MS = 5000;

const DEFAULT_SYMBOLS: { symbol: string; name: string }[] = [
  // Indices
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'NASDAQ' },
  { symbol: 'DIA', name: 'DOW' },
  { symbol: 'IWM', name: 'Russell 2000' },
  // Mega caps + high-volatility
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
];

export const INDICES = ['SPY', 'QQQ', 'DIA', 'IWM'];

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

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const pricesRef = useRef<Record<string, { price: number; prevClose: number }>>({});

  // Fetch initial prices via REST (one call per symbol)
  const fetchInitial = useCallback(async () => {
    if (!mountedRef.current) return;

    // Stagger calls to stay within 60/min rate limit
    for (const { symbol } of SYMBOLS) {
      if (!mountedRef.current) break;
      try {
        const res = await fetch(`${FINNHUB_REST}?symbol=${symbol}&token=${FINNHUB_KEY}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (!mountedRef.current) break;

        if (data.c && data.c > 0) {
          pricesRef.current[symbol] = {
            price: data.c,
            prevClose: data.pc || data.c,
          };

          const change = data.pc > 0 ? ((data.c - data.pc) / data.pc) * 100 : 0;

          setStocks((prev) => {
            const next = prev.map((s) =>
              s.symbol === symbol
                ? { ...s, price: data.c, change }
                : s,
            );
            setCache('stock_prices', next, 'finnhub');
            return next;
          });
        }
      } catch {}
    }
  }, []);

  // Real-time updates via WebSocket
  const connectWs = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(FINNHUB_WS);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        // Subscribe to all symbols
        for (const { symbol } of SYMBOLS) {
          ws.send(JSON.stringify({ type: 'subscribe', symbol }));
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== 'trade' || !msg.data) return;

          // Process trades — take the last price for each symbol
          const updates: Record<string, number> = {};
          for (const trade of msg.data) {
            updates[trade.s] = trade.p;
          }

          setStocks((prev) =>
            prev.map((s) => {
              if (!updates[s.symbol]) return s;
              const price = updates[s.symbol];
              const prevClose = pricesRef.current[s.symbol]?.prevClose || price;
              const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

              pricesRef.current[s.symbol] = {
                ...pricesRef.current[s.symbol],
                price,
              };

              return { ...s, price, change };
            }),
          );
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        reconnectTimer.current = setTimeout(connectWs, RECONNECT_MS);
      };

      ws.onerror = () => { ws.close(); };
    } catch {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchInitial();
    connectWs();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        // Unsubscribe
        if (wsRef.current.readyState === WebSocket.OPEN) {
          for (const { symbol } of SYMBOLS) {
            wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbol }));
          }
        }
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [fetchInitial, connectWs]);

  return stocks;
}
