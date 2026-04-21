import { useEffect, useState, useRef } from 'react';

export interface PingResult {
  name: string;
  latency: number; // ms, -1 = failed
}

// Known-good anycast endpoints that do not retain visitor IPs for analytics.
// Dropped: dynamodb.*.amazonaws.com (exposed IP to AWS), dns.google/quad9/opendns
// DoH (returned 503 due to bot detection), google.com/generate_204 (503).
const ENDPOINTS = [
  { name: 'Cloudflare 1.1.1.1', url: 'https://1.1.1.1/cdn-cgi/trace' },
  { name: 'Cloudflare Edge', url: 'https://speed.cloudflare.com/__down?bytes=0' },
  { name: 'TerminalFeed', url: '/api/health' },
  { name: 'Cloudflare DNS (DoH)', url: 'https://cloudflare-dns.com/dns-query?name=example.com&type=A' },
];

const POLL_MS = 60_000;

export function useInternetPulse(): PingResult[] {
  const [results, setResults] = useState<PingResult[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const ping = async () => {
      const pings = await Promise.all(
        ENDPOINTS.map(async (ep) => {
          try {
            const start = performance.now();
            await fetch(ep.url, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(5000) });
            const latency = Math.round(performance.now() - start);
            return { name: ep.name, latency };
          } catch {
            return { name: ep.name, latency: -1 };
          }
        })
      );
      if (mountedRef.current) setResults(pings);
    };

    ping();
    const id = setInterval(ping, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return results;
}
