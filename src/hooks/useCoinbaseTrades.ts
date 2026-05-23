// Coinbase Exchange trade tape: every BTC-USD trade as it happens.
// Pairs with the Binance 24hr ticker (useBtcPrice) which has full daily stats
// but no per-trade granularity. Coinbase matches channel gives us buy/sell
// direction (taker side), size, and price for each fill.
//
// Public WS, no key. Throttled so a busy market doesn't flood the panel.

import { useEffect, useRef, useState } from 'react';

export interface BtcTrade {
  price: number;
  size: number;
  side: 'buy' | 'sell';
  time: number;
}

const WS_URL = 'wss://ws-feed.exchange.coinbase.com';
const PRODUCT = 'BTC-USD';
const MAX_TRADES = 8;
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;
const THROTTLE_MS = IS_MOBILE ? 3000 : 750;

export function useCoinbaseTrades(): BtcTrade[] {
  const [trades, setTrades] = useState<BtcTrade[]>([]);
  const mountedRef = useRef(true);
  const lastAddRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (!mountedRef.current) return;
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          ws.send(JSON.stringify({
            type: 'subscribe',
            channels: [{ name: 'matches', product_ids: [PRODUCT] }],
          }));
        };

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
          const now = Date.now();
          if (now - lastAddRef.current < THROTTLE_MS) return;

          try {
            const msg = JSON.parse(event.data);
            if (msg.type !== 'match' && msg.type !== 'last_match') return;
            const price = parseFloat(msg.price);
            const size = parseFloat(msg.size);
            const side = msg.side === 'buy' || msg.side === 'sell' ? msg.side : null;
            if (!Number.isFinite(price) || !Number.isFinite(size) || !side) return;

            lastAddRef.current = now;
            setTrades(prev => [{ price, size, side, time: now }, ...prev].slice(0, MAX_TRADES));
          } catch (e) {
            if (import.meta.env.DEV) console.warn('[CoinbaseTrades]', e);
          }
        };

        ws.onerror = () => ws?.close();
        ws.onclose = () => {
          if (mountedRef.current) {
            reconnectTimer = window.setTimeout(connect, 5000);
          }
        };
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[CoinbaseTrades]', e);
      }
    };

    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer != null) window.clearTimeout(reconnectTimer);
      try { ws?.close(); } catch { /* noop */ }
    };
  }, []);

  return trades;
}
