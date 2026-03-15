import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface ServiceStatus {
  name: string;
  indicator: 'none' | 'minor' | 'major' | 'critical' | 'unknown';
  description: string;
}

const SERVICES = [
  { name: 'GitHub', url: 'https://www.githubstatus.com/api/v2/status.json' },
  { name: 'Cloudflare', url: 'https://www.cloudflarestatus.com/api/v2/status.json' },
  { name: 'Vercel', url: 'https://www.vercel-status.com/api/v2/status.json' },
  { name: 'OpenAI', url: 'https://status.openai.com/api/v2/status.json' },
  { name: 'Anthropic', url: 'https://status.anthropic.com/api/v2/status.json' },
  { name: 'npm', url: 'https://status.npmjs.org/api/v2/status.json' },
  { name: 'Discord', url: 'https://discordstatus.com/api/v2/status.json' },
  { name: 'Slack', url: 'https://status.slack.com/api/v2.0.0/current' },
  { name: 'Atlassian', url: 'https://status.atlassian.com/api/v2/status.json' },
  { name: 'Reddit', url: 'https://www.redditstatus.com/api/v2/status.json' },
  { name: 'Stripe', url: 'https://status.stripe.com/api/v2/status.json' },
  { name: 'Zoom', url: 'https://status.zoom.us/api/v2/status.json' },
  { name: 'Datadog', url: 'https://status.datadoghq.com/api/v2/status.json' },
];

const CACHE_KEY = 'dev_status';
const POLL_MS = 60_000; // 60s

export function useDevStatus(): ServiceStatus[] {
  const [statuses, setStatuses] = useState<ServiceStatus[]>(() => {
    const cached = getCache<ServiceStatus[]>(CACHE_KEY);
    return cached?.data ?? SERVICES.map(s => ({
      name: s.name,
      indicator: 'unknown' as const,
      description: 'Checking...',
    }));
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      const results = await Promise.all(
        SERVICES.map(async (svc) => {
          try {
            const res = await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error('not ok');
            const json = await res.json();
            return {
              name: svc.name,
              indicator: (json.status?.indicator ?? 'unknown') as ServiceStatus['indicator'],
              description: json.status?.description ?? 'Unknown',
            };
          } catch {
            return {
              name: svc.name,
              indicator: 'unknown' as const,
              description: 'Unable to reach',
            };
          }
        })
      );

      if (!mountedRef.current) return;
      setStatuses(results);
      setCache(CACHE_KEY, results, 'statuspage');
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return statuses;
}
