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
const MAX_TRADES = 5;
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;
// Coinbase BTC-USD fires hundreds of HFT prints/second, most of them dust
// (sub-$1 market-maker activity). The slow throttle + dust filter make the
// tape readable: only meaningful prints get through, paced at a glanceable
// rate rather than blink-fast.
const THROTTLE_MS = IS_MOBILE ? 6000 : 4000;
// Drop any trade smaller than this many BTC. At $77K/BTC, 0.05 BTC is ~$3.8K
// notional: small enough to capture retail activity, large enough to skip
// the satoshi-tier HFT dust that visually dominates an unfiltered feed.
const MIN_BTC = 0.05;

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
            // Dust filter: skip sub-MIN_BTC prints so the visible tape carries signal.
            if (size < MIN_BTC) return;

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
