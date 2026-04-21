import { useState, useEffect, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface GameScore {
  id: string;
  eventId: string;
  league: string;
  sport: string;
  leaguePath: string;
  status: string; // "in", "pre", "post"
  statusDetail: string;
  homeTeam: string;
  homeAbbr: string;
  homeScore: string;
  awayTeam: string;
  awayAbbr: string;
  awayScore: string;
  // Live play-by-play (only for in-progress games)
  lastPlay: string;
  situation: string; // "Top 7th", "Q4 2:14", "2nd & 7", etc
}

// Leagues rotate by month so off-season sports don't clutter the ticker
function getActiveLeagues() {
  const month = new Date().getMonth(); // 0-indexed
  const leagues: { key: string; sport: string; league: string; url: string }[] = [];

  const scoreboard = (sport: string, league: string) =>
    `/api/sports-scoreboard?sport=${sport}&league=${league}`;

  // NBA: Oct (9) through Jun (5)
  if (month >= 9 || month <= 5) {
    leagues.push({ key: 'nba', sport: 'basketball', league: 'nba', url: scoreboard('basketball', 'nba') });
  }
  // NHL: Oct (9) through Jun (5)
  if (month >= 9 || month <= 5) {
    leagues.push({ key: 'nhl', sport: 'hockey', league: 'nhl', url: scoreboard('hockey', 'nhl') });
  }
  // MLB: Mar (2) through Oct (9)
  if (month >= 2 && month <= 9) {
    leagues.push({ key: 'mlb', sport: 'baseball', league: 'mlb', url: scoreboard('baseball', 'mlb') });
  }
  // NFL: Sep (8) through Feb (1)
  if (month >= 8 || month <= 1) {
    leagues.push({ key: 'nfl', sport: 'football', league: 'nfl', url: scoreboard('football', 'nfl') });
  }

  return leagues;
}

const LEAGUES = getActiveLeagues();

const SUMMARY_POLL_MS = 15_000; // 15s — fast enough for live play-by-play
const CACHE_KEY = 'sports_scores';

// Fetch play-by-play summary for a live game
async function fetchGameSummary(sport: string, league: string, eventId: string): Promise<{ lastPlay: string; situation: string }> {
  try {
    const url = `/api/sports-summary?sport=${sport}&league=${league}&event=${eventId}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { lastPlay: '', situation: '' };
    const data = await res.json();

    let lastPlay = '';
    let situation = '';

    // Extract situation based on sport
    const sit = data.situation || data.drives?.current || {};
    const header = data.header?.competitions?.[0];

    if (league === 'mlb') {
      // Baseball: inning, count, runners
      const s = sit;
      if (s.batter?.athlete?.shortName) {
        const count = s.balls != null ? `${s.balls}-${s.strikes}` : '';
        const outs = s.outs != null ? `${s.outs} out` : '';
        situation = [s.isTopInning ? 'Top' : 'Bot', s.inning ? `${s.inning}th` : '', count, outs].filter(Boolean).join(' · ');
        lastPlay = `AB: ${s.batter.athlete.shortName}`;
      }
    } else if (league === 'nfl') {
      // Football: down, distance, possession
      if (sit.downDistanceText) {
        situation = sit.downDistanceText;
        if (sit.possessionText) situation += ` · ${sit.possessionText}`;
      }
    } else if (league === 'nba') {
      // Basketball: last play
      if (header?.status?.displayClock) {
        situation = `${header.status.period}Q ${header.status.displayClock}`;
      }
    } else if (league === 'nhl') {
      // Hockey: period, time
      if (header?.status?.displayClock) {
        situation = `P${header.status.period} ${header.status.displayClock}`;
      }
    }

    // Last play from plays array
    const plays = data.plays || data.drives?.previous?.[0]?.plays;
    if (Array.isArray(plays) && plays.length > 0) {
      const last = plays[plays.length - 1];
      lastPlay = last.text || last.description || lastPlay;
      if (lastPlay.length > 80) lastPlay = lastPlay.slice(0, 77) + '...';
    }

    return { lastPlay, situation };
  } catch {
    return { lastPlay: '', situation: '' };
  }
}

export function useSportsScores() {
  const [games, setGames] = useState<GameScore[]>(() => {
    return getCache<GameScore[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchScoreboard = async () => {
      if (!mountedRef.current) return;

      const allGames: GameScore[] = [];

      await Promise.all(
        LEAGUES.map(async ({ key, sport, league, url }) => {
          try {
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) return;
            const data = await res.json();
            const events = data.events || [];

            for (const event of events) {
              const comp = event.competitions?.[0];
              if (!comp) continue;

              const home = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === 'home');
              const away = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === 'away');
              if (!home || !away) continue;

              const status = comp.status || event.status;
              const state = status?.type?.state || 'pre';

              allGames.push({
                id: `${key}-${event.id}`,
                eventId: event.id,
                league: key.toUpperCase(),
                sport,
                leaguePath: league,
                status: state,
                statusDetail: status?.type?.shortDetail || status?.type?.detail || '',
                homeTeam: home.team?.shortDisplayName || home.team?.displayName || '',
                homeAbbr: home.team?.abbreviation || '',
                homeScore: home.score || '0',
                awayTeam: away.team?.shortDisplayName || away.team?.displayName || '',
                awayAbbr: away.team?.abbreviation || '',
                awayScore: away.score || '0',
                lastPlay: '',
                situation: '',
              });
            }
          } catch (e) { if (import.meta.env.DEV) console.warn('[SportsScores]', e); }
        }),
      );

      if (!mountedRef.current) return;

      // Fetch play-by-play for live games
      const liveGames = allGames.filter(g => g.status === 'in');
      if (liveGames.length > 0) {
        const summaries = await Promise.allSettled(
          liveGames.map(g => fetchGameSummary(g.sport, g.leaguePath, g.eventId))
        );
        liveGames.forEach((g, i) => {
          if (summaries[i].status === 'fulfilled') {
            g.lastPlay = summaries[i].value.lastPlay;
            g.situation = summaries[i].value.situation;
          }
        });
      }

      // Sort: live first, then upcoming, then finished
      const order = { in: 0, pre: 1, post: 2 };
      allGames.sort((a, b) => (order[a.status as keyof typeof order] ?? 1) - (order[b.status as keyof typeof order] ?? 1));
      setGames(allGames);
      setCache(CACHE_KEY, allGames, 'espn');
    };

    fetchScoreboard();
    // Use faster polling when there are live games
    const id = setInterval(fetchScoreboard, SUMMARY_POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return games;
}
