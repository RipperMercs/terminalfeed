import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface SteamGame {
  appId: number;
  name: string;
  playerCount: number;
}

// Known top Steam games by appid — the API doesn't return names
const GAME_NAMES: Record<number, string> = {
  730: 'Counter-Strike 2',
  578080: 'PUBG: Battlegrounds',
  570: 'Dota 2',
  440: 'Team Fortress 2',
  1172470: 'Apex Legends',
  252490: 'Rust',
  271590: 'Grand Theft Auto V',
  1245620: 'Elden Ring',
  892970: 'Valheim',
  413150: 'Stardew Valley',
  1091500: 'Cyberpunk 2077',
  1085660: 'Destiny 2',
  346110: 'ARK: Survival Evolved',
  236390: 'War Thunder',
  1599340: 'Lost Ark',
  1203220: 'NARAKA: BLADEPOINT',
  431960: 'Wallpaper Engine',
  105600: 'Terraria',
  1716740: 'Lethal Company',
  2357570: 'Overwatch 2',
  238960: 'Path of Exile',
  1623730: "Baldur's Gate 3",
  242760: 'The Forest',
  304930: 'Unturned',
  1222670: 'The Sims 4',
  1574580: 'HELLDIVERS 2',
  553850: 'Hell Let Loose',
  1517290: 'Battlefield 2042',
  381210: 'Dead by Daylight',
  739630: 'Phasmophobia',
  2399830: 'Palworld',
  394360: 'Hearts of Iron IV',
  1604030: 'V Rising',
  1086940: 'Baldur\'s Gate 3',
  2358720: 'Black Myth: Wukong',
  359550: 'Tom Clancy\'s Rainbow Six Siege',
  1326470: 'Sons Of The Forest',
};

const API_URL = 'https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/';
const CACHE_KEY = 'steam_games';
const POLL_MS = 5 * 60_000;

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
        if (!res.ok) return;
        const json = await res.json();
        const ranks = json.response?.ranks;
        if (!ranks || !mountedRef.current) return;

        const results: SteamGame[] = ranks.slice(0, 10).map((g: {
          appid: number;
          peak_in_game: number;
          concurrent_in_game?: number;
        }) => ({
          appId: g.appid,
          name: GAME_NAMES[g.appid] || `Game #${g.appid}`,
          playerCount: g.concurrent_in_game ?? g.peak_in_game ?? 0,
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
