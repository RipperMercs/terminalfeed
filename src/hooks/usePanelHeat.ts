// Panel Heat Score: calculates relevance/activity score for each panel
// Used for smart default ordering: most active/relevant panels bubble to top
// Recalculates every 60 seconds

import { useEffect, useState, useRef } from 'react';

export interface PanelHeat {
  id: string;
  score: number; // 0-100, higher = more relevant right now
}

// Base priority (editorial weight: some panels are always important)
const BASE_PRIORITY: Record<string, number> = {
  'bitcoin': 95,        // BTC price is always #1
  'markets': 85,        // Stocks matter
  'crypto': 80,         // Crypto prices
  'btc-network': 75,    // Network data
  'crypto-global': 70,  // Market overview
  'news': 90,           // News is always high
  'market-hours': 60,   // Context
  'reddit': 55,         // Social
  'github': 50,         // Dev content
  'dev-status': 65,     // Infra status: spikes when something is down
  'stackoverflow': 45,  // Dev questions
  'podcasts': 35,       // Entertainment
  'seismic': 40,        // Earthquakes
  'weather': 45,        // Universal
  'launches': 35,       // Space
  'ai-leaderboard': 50, // AI rankings
  'bluesky': 35,        // Social
  'internet-pulse': 30, // Network health
  'uap': 25,            // Novelty
  'recipe': 20,         // Fun
  'daily-learn': 20,    // Educational
  'ai-image': 15,       // Interactive toy
  'support': 5,         // Always last
};

interface HeatInputs {
  btcChangeAbs: number;      // absolute 24h BTC change %
  liveGamesCount: number;    // number of live sports games
  devStatusIssues: number;   // number of non-operational services
  earthquakeMag5: boolean;   // any M5.0+ quake in last 24h
  fearGreedValue: number;    // 0-100, extreme values = more relevant
}

export function calculateHeatScores(inputs: HeatInputs): PanelHeat[] {
  const scores: PanelHeat[] = [];

  for (const [id, base] of Object.entries(BASE_PRIORITY)) {
    let score = base;

    // BTC volatility boost: big moves make BTC/crypto panels more relevant
    if (inputs.btcChangeAbs > 5) {
      if (['bitcoin', 'btc-network', 'crypto', 'crypto-global'].includes(id)) {
        score += 15;
      }
    } else if (inputs.btcChangeAbs > 3) {
      if (['bitcoin', 'btc-network', 'crypto'].includes(id)) {
        score += 8;
      }
    }

    // Dev status boost: if anything is down, this becomes critical
    if (inputs.devStatusIssues > 0 && id === 'dev-status') {
      score += 25;
    }

    // Earthquake boost: major quake activity
    if (inputs.earthquakeMag5 && id === 'seismic') {
      score += 20;
    }

    // Fear & Greed extreme: fear/greed panels more relevant at extremes
    if ((inputs.fearGreedValue < 20 || inputs.fearGreedValue > 80)) {
      if (['bitcoin', 'crypto', 'markets'].includes(id)) {
        score += 10;
      }
    }

    scores.push({ id, score: Math.min(100, score) });
  }

  return scores.sort((a, b) => b.score - a.score);
}

export function usePanelHeat(inputs: HeatInputs): PanelHeat[] {
  const [heat, setHeat] = useState<PanelHeat[]>(() => calculateHeatScores(inputs));
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;

  useEffect(() => {
    const update = () => setHeat(calculateHeatScores(inputsRef.current));
    update();
    const id = setInterval(update, 60_000); // recalculate every minute
    return () => clearInterval(id);
  }, []);

  // Also recalculate when inputs change significantly
  useEffect(() => {
    setHeat(calculateHeatScores(inputs));
  }, [
    inputs.btcChangeAbs > 3,
    inputs.liveGamesCount > 0,
    inputs.devStatusIssues > 0,
    inputs.earthquakeMag5,
    inputs.fearGreedValue < 20 || inputs.fearGreedValue > 80,
  ]);

  return heat;
}
