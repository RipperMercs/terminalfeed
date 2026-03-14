import { useEffect, useRef, useState, useCallback } from 'react';

export interface MempoolBlock {
  height: number;
  hash: string;
  timestamp: number;
  size: number;
  txCount: number;
  pool?: string;
}

const MEMPOOL_WS = 'wss://mempool.space/api/v1/ws';
const RECONNECT_DELAY = 5000;

export function useBlockStream() {
  const [latestBlock, setLatestBlock] = useState<MempoolBlock | null>(null);
  const [mempoolSize, setMempoolSize] = useState<number | null>(null);
  const [feeRate, setFeeRate] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(MEMPOOL_WS);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        ws.send(JSON.stringify({ action: 'want', data: ['blocks', 'stats', 'mempool-blocks'] }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.block) {
            setLatestBlock({
              height: msg.block.height,
              hash: msg.block.id,
              timestamp: msg.block.timestamp,
              size: msg.block.size,
              txCount: msg.block.tx_count,
              pool: msg.block.extras?.pool?.name,
            });
          }
          if (msg.mempoolInfo) {
            setMempoolSize(msg.mempoolInfo.size);
          }
          if (msg.fees) {
            setFeeRate(msg.fees.fastestFee);
          }
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => { ws.close(); };
    } catch {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { latestBlock, mempoolSize, feeRate, connected };
}
