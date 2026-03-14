import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface SteamGame {
  appId: number;
  name: string;
  playerCount: number;
}

const API_URL = 'https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/';
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
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const json = await res.json();
        const ranks = json.response?.ranks;
        if (!ranks || !mountedRef.current) return;

        const results: SteamGame[] = ranks.slice(0, 10).map((g: {
          appid: number;
          name: string;
          concurrent_in_game: number;
        }) => ({
          appId: g.appid,
          name: g.name || `App ${g.appid}`,
          playerCount: g.concurrent_in_game,
        }));

        setGames(results);
        setCache(CACHE_KEY, results, 'steam');
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return games;
}
