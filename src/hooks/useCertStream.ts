// Certificate Transparency Stream — watch the internet being built in real-time
// WebSocket stream of SSL certificates being issued worldwide

import { useEffect, useState, useRef } from 'react';

export interface CertEntry {
  domain: string;
  issuer: string;
  time: number;
}

const WS_URL = 'wss://certstream.calidog.io';
const MAX_CERTS = 15;

export function useCertStream(): CertEntry[] {
  const [certs, setCerts] = useState<CertEntry[]>([]);
  const mountedRef = useRef(true);
  const lastAddRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    let ws: WebSocket | null = null;

    const connect = () => {
      if (!mountedRef.current) return;
      try {
        ws = new WebSocket(WS_URL);

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
          // Throttle to ~1 per second (stream fires hundreds/sec)
          const now = Date.now();
          if (now - lastAddRef.current < 1000) return;

          try {
            const data = JSON.parse(event.data);
            if (data.message_type !== 'certificate_update') return;

            const domain = data.data?.leaf_cert?.all_domains?.[0];
            const issuer = data.data?.leaf_cert?.issuer?.O || 'Unknown';

            if (!domain || domain.startsWith('*.') || domain.length > 45) return;
            // Filter out boring/internal domains
            if (domain.includes('local') || domain.includes('internal')) return;

            lastAddRef.current = now;
            setCerts(prev => [{ domain, issuer, time: now }, ...prev].slice(0, MAX_CERTS));
          } catch (e) { if (import.meta.env.DEV) console.warn('[CertStream]', e); }
        };

        ws.onerror = () => ws?.close();
        ws.onclose = () => {
          if (mountedRef.current) setTimeout(connect, 5000);
        };
      } catch (e) { if (import.meta.env.DEV) console.warn('[CertStream]', e); }
    };

    connect();
    return () => {
      mountedRef.current = false;
      ws?.close();
    };
  }, []);

  return certs;
}
