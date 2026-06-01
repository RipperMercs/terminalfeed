import { useState, useEffect, useRef } from 'react';

export interface LeaderboardModel {
  rank: number;
  name: string;
  company: string;
  elo: number;
}

export interface LeaderboardFreshnessFlag {
  model: string;
  released?: string | null;
  message: string;
}

export interface LeaderboardFreshness {
  checkedAt?: number;
  catalogLastUpdated?: string | null;
  flags: LeaderboardFreshnessFlag[];
}

export interface AiLeaderboardData {
  generatedAt: string;
  leaderboard: LeaderboardModel[];
  freshness: LeaderboardFreshness | null;
}

const POLL_MS = 6 * 60 * 60_000;
const MOBILE_POLL_MS = 12 * 60 * 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

// Fetches the ELO leaderboard + catalog-driven freshness from the Worker. Returns
// null until the first successful fetch; the panel falls back to the bundled
// snapshot in that window so it never renders blank (self-healing, rule #9).
export function useAiLeaderboard() {
  const [data, setData] = useState<AiLeaderboardData | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/ai-leaderboard', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current) return;
        if (json && Array.isArray(json.leaderboard)) {
          const fresh = json.freshness;
          setData({
            generatedAt: json.generatedAt ?? '',
            leaderboard: json.leaderboard,
            freshness: fresh && Array.isArray(fresh.flags)
              ? {
                  checkedAt: fresh.checkedAt,
                  catalogLastUpdated: fresh.catalogLastUpdated ?? null,
                  flags: fresh.flags,
                }
              : null,
          });
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[AiLeaderboard]', e); }
    };

    const poll = isMobile() ? MOBILE_POLL_MS : POLL_MS;
    fetchData();
    intervalRef.current = setInterval(fetchData, poll);

    const onVisChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchData();
        intervalRef.current = setInterval(fetchData, poll);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return data;
}
