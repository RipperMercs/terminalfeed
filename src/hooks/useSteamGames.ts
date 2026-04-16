// Steam Top Games — now via our own Worker (no CORS issues)
import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface SteamGame {
  appId: number;
  name: string;
  playerCount: number;
}

const API_URL = '/api/steam';
const CACHE_KEY = 'steam_games';
const POLL_MS = 5 * 60_000; // 5 min

export function useSteamGames(): SteamGame[] {
  const [games, setGames] = useState<SteamGame[]>(() => {
    return getCache<SteamGame[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const data = json.data || json;
        if (!Array.isArray(data) || data.length === 0) return;

        const results: SteamGame[] = data.slice(0, 10).map((g: { name: string; players_now: number }, i: number) => ({
          appId: i,
          name: g.name || 'Unknown',
          playerCount: g.players_now || 0,
        }));

        if (results.length > 0 && mountedRef.current) {
          setGames(results);
          setCache(CACHE_KEY, results, 'worker');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[SteamGames]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return games;
}
