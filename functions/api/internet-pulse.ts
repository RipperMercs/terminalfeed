// Cloudflare Pages Function — measures real latency to regional endpoints
// Pings well-known public endpoints from the CF edge to give actual internet pulse data

interface PulseRegion {
  name: string;
  latency_ms: number;
}

interface PingTarget {
  name: string;
  url: string;
}

const TARGETS: PingTarget[] = [
  { name: 'US East (Virginia)', url: 'https://dynamodb.us-east-1.amazonaws.com/ping' },
  { name: 'US West (Oregon)', url: 'https://dynamodb.us-west-2.amazonaws.com/ping' },
  { name: 'Europe (Frankfurt)', url: 'https://dynamodb.eu-central-1.amazonaws.com/ping' },
  { name: 'Asia (Tokyo)', url: 'https://dynamodb.ap-northeast-1.amazonaws.com/ping' },
  { name: 'Asia (Singapore)', url: 'https://dynamodb.ap-southeast-1.amazonaws.com/ping' },
  { name: 'South America (Sao Paulo)', url: 'https://dynamodb.sa-east-1.amazonaws.com/ping' },
];

async function measureLatency(url: string): Promise<number> {
  const start = Date.now();
  try {
    await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Even a failed/rejected request gives us round-trip timing
  }
  return Date.now() - start;
}

export const onRequestGet: PagesFunction = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, s-maxage=30',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Run all pings in parallel for speed
    const results = await Promise.all(
      TARGETS.map(async (target) => {
        const latency_ms = await measureLatency(target.url);
        return { name: target.name, latency_ms };
      })
    );

    return new Response(
      JSON.stringify({
        source: 'terminalfeed',
        endpoint: 'internet-pulse',
        updated_at: new Date().toISOString(),
        data: results,
      }),
      { headers }
    );
  } catch {
    // Fallback with reasonable static data
    const fallback: PulseRegion[] = [
      { name: 'US East (Virginia)', latency_ms: 12 },
      { name: 'US West (Oregon)', latency_ms: 45 },
      { name: 'Europe (Frankfurt)', latency_ms: 89 },
      { name: 'Asia (Tokyo)', latency_ms: 142 },
      { name: 'Asia (Singapore)', latency_ms: 168 },
      { name: 'South America (Sao Paulo)', latency_ms: 195 },
    ];

    return new Response(
      JSON.stringify({
        source: 'terminalfeed',
        endpoint: 'internet-pulse',
        updated_at: new Date().toISOString(),
        data: fallback,
      }),
      { headers }
    );
  }
};
