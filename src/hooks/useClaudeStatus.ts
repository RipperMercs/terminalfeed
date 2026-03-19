import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface ClaudeComponent {
  id: string;
  name: string;
  status: 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance';
}

export interface ClaudeIncident {
  id: string;
  name: string;
  status: string;
  impact: 'none' | 'minor' | 'major' | 'critical';
  started_at: string;
  updated_at: string;
}

export interface ClaudeStatusData {
  overall: { indicator: string; description: string };
  components: ClaudeComponent[];
  incidents: ClaudeIncident[];
}

const API_URL = 'https://status.claude.com/api/v2/summary.json';
const CACHE_KEY = 'claude_status';
const POLL_MS = 60_000;

// Friendly short names for display
const SHORT_NAMES: Record<string, string> = {
  'claude.ai': 'claude.ai',
  'platform.claude.com (formerly console.anthropic.com)': 'Console',
  'Claude API (api.anthropic.com)': 'API',
  'Claude Code': 'Claude Code',
  'Claude for Government': 'Gov',
};

export function useClaudeStatus() {
  const [data, setData] = useState<ClaudeStatusData | null>(() => {
    const cached = getCache<ClaudeStatusData>(CACHE_KEY);
    return cached?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current) return;

        const result: ClaudeStatusData = {
          overall: {
            indicator: json.status?.indicator ?? 'unknown',
            description: json.status?.description ?? 'Unknown',
          },
          components: (json.components ?? [])
            .filter((c: any) => c.showcase !== false && !c.group)
            .map((c: any) => ({
              id: c.id,
              name: SHORT_NAMES[c.name] ?? c.name,
              status: c.status,
            })),
          incidents: (json.incidents ?? []).slice(0, 3).map((inc: any) => ({
            id: inc.id,
            name: inc.name,
            status: inc.status,
            impact: inc.impact,
            started_at: inc.started_at,
            updated_at: inc.updated_at,
          })),
        };

        setData(result);
        setCache(CACHE_KEY, result, 'statuspage');
      } catch {}
    };

    fetchStatus();
    const id = setInterval(fetchStatus, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
