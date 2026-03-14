import { useState, useEffect, useRef } from 'react';

export interface GameScore {
  id: string;
  league: string;
  status: string; // "in", "pre", "post"
  statusDetail: string;
  homeTeam: string;
  homeAbbr: string;
  homeScore: string;
  awayTeam: string;
  awayAbbr: string;
  awayScore: string;
}

// ESPN public scoreboard endpoints — no auth needed
const LEAGUES = [
  { key: 'nba', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard' },
  { key: 'nfl', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' },
  { key: 'mlb', url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard' },
  { key: 'nhl', url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard' },
];

const POLL_MS = 30_000; // 30s — scores update frequently during games

export function useSportsScores() {
  const [games, setGames] = useState<GameScore[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      if (!mountedRef.current) return;

      const allGames: GameScore[] = [];

      await Promise.all(
        LEAGUES.map(async ({ key, url }) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            const events = data.events || [];

            for (const event of events) {
              const competition = event.competitions?.[0];
              if (!competition) continue;

              const home = competition.competitors?.find((c: any) => c.homeAway === 'home');
              const away = competition.competitors?.find((c: any) => c.homeAway === 'away');
              if (!home || !away) continue;

              const status = competition.status || event.status;

              allGames.push({
                id: `${key}-${event.id}`,
                league: key.toUpperCase(),
                status: status?.type?.state || 'pre',
                statusDetail: status?.type?.shortDetail || status?.type?.detail || '',
                homeTeam: home.team?.shortDisplayName || home.team?.displayName || '',
                homeAbbr: home.team?.abbreviation || '',
                homeScore: home.score || '0',
                awayTeam: away.team?.shortDisplayName || away.team?.displayName || '',
                awayAbbr: away.team?.abbreviation || '',
                awayScore: away.score || '0',
              });
            }
          } catch {}
        }),
      );

      if (mountedRef.current) {
        // Sort: live games first, then upcoming, then finished
        const order = { in: 0, pre: 1, post: 2 };
        allGames.sort((a, b) => (order[a.status as keyof typeof order] ?? 1) - (order[b.status as keyof typeof order] ?? 1));
        setGames(allGames);
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return games;
}
