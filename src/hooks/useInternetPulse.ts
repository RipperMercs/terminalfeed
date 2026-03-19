import { useEffect, useState, useRef } from 'react';

export interface PingResult {
  name: string;
  latency: number; // ms, -1 = failed
}

const ENDPOINTS = [
  { name: 'US East', url: 'https://dynamodb.us-east-1.amazonaws.com/' },
  { name: 'US West', url: 'https://dynamodb.us-west-2.amazonaws.com/' },
  { name: 'Europe', url: 'https://dynamodb.eu-west-1.amazonaws.com/' },
  { name: 'Asia', url: 'https://dynamodb.ap-northeast-1.amazonaws.com/' },
  { name: 'Cloudflare', url: 'https://1.1.1.1/cdn-cgi/trace' },
  { name: 'Google', url: 'https://www.google.com/generate_204' },
  // DNS infrastructure
  { name: 'DNS: Google', url: 'https://dns.google/resolve?name=example.com&type=A' },
  { name: 'DNS: Quad9', url: 'https://dns.quad9.net:5053/dns-query?name=example.com&type=A' },
  { name: 'DNS: OpenDNS', url: 'https://doh.opendns.com/dns-query?name=example.com&type=A' },
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
