import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface SteamGame {
  appId: number;
  name: string;
  playerCount: number;
}

// Primary: SteamSpy (has names + concurrent users, no key needed)
const STEAMSPY_URL = 'https://steamspy.com/api.php?request=top100in2weeks';
// Fallback: Steam Charts API
const STEAM_API_URL = 'https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/';

const CACHE_KEY = 'steam_games';
const POLL_MS = 5 * 60_000;

// Fallback game names for Steam Charts API (no names in response)
const GAME_NAMES: Record<number, string> = {
  730: 'Counter-Strike 2', 578080: 'PUBG', 570: 'Dota 2',
  440: 'Team Fortress 2', 1172470: 'Apex Legends', 252490: 'Rust',
  271590: 'GTA V', 1245620: 'Elden Ring', 238960: 'Path of Exile',
  1574580: 'HELLDIVERS 2', 2399830: 'Palworld', 105600: 'Terraria',
  1716740: 'Lethal Company', 381210: 'Dead by Daylight', 739630: 'Phasmophobia',
  2358720: 'Black Myth: Wukong', 1326470: 'Sons Of The Forest',
};

export function useSteamGames(): SteamGame[] {
  const [games, setGames] = useState<SteamGame[]>(() => {
    return getCache<SteamGame[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchSteamSpy = async (): Promise<SteamGame[] | null> => {
      try {
        const res = await fetch(STEAMSPY_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || typeof data !== 'object') return null;

        const entries = Object.values(data) as {
          appid: number;
          name: string;
          ccu: number;
        }[];

        // Sort by concurrent users, take top 10
        return entries
          .filter(g => g.ccu > 0)
          .sort((a, b) => b.ccu - a.ccu)
          .slice(0, 10)
          .map(g => ({
            appId: g.appid,
            name: g.name,
            playerCount: g.ccu,
          }));
      } catch {
        return null;
      }
    };

    const fetchSteamCharts = async (): Promise<SteamGame[] | null> => {
      try {
        const res = await fetch(STEAM_API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;
        const json = await res.json();
        const ranks = json.response?.ranks;
        if (!ranks) return null;

        return ranks.slice(0, 10).map((g: { appid: number; peak_in_game: number; concurrent_in_game?: number }) => ({
          appId: g.appid,
          name: GAME_NAMES[g.appid] || `Game #${g.appid}`,
          playerCount: g.concurrent_in_game ?? g.peak_in_game ?? 0,
        }));
      } catch {
        return null;
      }
    };

    const fetch_ = async () => {
      let results = await fetchSteamSpy();
      if (!results || results.length === 0) results = await fetchSteamCharts();
      if (!results || !mountedRef.current) return;

      setGames(results);
      setCache(CACHE_KEY, results, 'steamspy');
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return games;
}
