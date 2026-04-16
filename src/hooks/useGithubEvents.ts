// GitHub Public Events — real-time stream of global coding activity

import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface GHEvent {
  id: string;
  type: string; // PushEvent, WatchEvent, PullRequestEvent, etc
  actor: string;
  repo: string;
  action: string; // human-readable
  time: string;
}

const API_URL = 'https://api.github.com/events?per_page=20';
const CACHE_KEY = 'github_events';
const POLL_MS = 2 * 60_000; // 2 min (60 req/hour limit)

const EVENT_ICONS: Record<string, string> = {
  PushEvent: 'pushed to',
  WatchEvent: 'starred',
  PullRequestEvent: 'PR on',
  IssuesEvent: 'issue on',
  CreateEvent: 'created',
  ForkEvent: 'forked',
  ReleaseEvent: 'released',
};

export function useGithubEvents(): GHEvent[] {
  const [events, setEvents] = useState<GHEvent[]>(() => {
    return getCache<GHEvent[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok || !mountedRef.current) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const results: GHEvent[] = data.slice(0, 10).map((e: {
          id: string;
          type: string;
          actor: { login: string };
          repo: { name: string };
          created_at: string;
        }) => ({
          id: e.id,
          type: e.type,
          actor: e.actor?.login || 'unknown',
          repo: e.repo?.name || '',
          action: EVENT_ICONS[e.type] || e.type.replace('Event', '').toLowerCase(),
          time: e.created_at || '',
        }));

        setEvents(results);
        setCache(CACHE_KEY, results, 'github');
      } catch (e) { if (import.meta.env.DEV) console.warn('[GithubEvents]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return events;
}
