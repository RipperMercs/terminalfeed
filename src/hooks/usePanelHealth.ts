// Panel Health Monitor — tracks which panels have working data
// Panels with no data after timeout become "unhealthy" and can be
// auto-hidden from the grid, then restored when data returns.

import { useState, useEffect, useRef } from 'react';

interface PanelHealthState {
  [panelId: string]: {
    hasData: boolean;
    lastDataAt: number;
    failCount: number;
  };
}

const STALE_THRESHOLD = 5 * 60_000; // 5 min — if no data for 5 min, consider unhealthy
const CHECK_INTERVAL = 30_000; // check every 30s

export function usePanelHealth() {
  const [health, setHealth] = useState<PanelHealthState>({});
  const healthRef = useRef(health);
  healthRef.current = health;

  // Report that a panel has data
  const reportData = (panelId: string) => {
    setHealth(prev => ({
      ...prev,
      [panelId]: { hasData: true, lastDataAt: Date.now(), failCount: 0 },
    }));
  };

  // Report that a panel fetch failed
  const reportFail = (panelId: string) => {
    setHealth(prev => {
      const current = prev[panelId] || { hasData: false, lastDataAt: 0, failCount: 0 };
      return {
        ...prev,
        [panelId]: { ...current, failCount: current.failCount + 1 },
      };
    });
  };

  // Check if a panel is healthy (has recent data)
  const isHealthy = (panelId: string): boolean => {
    const state = health[panelId];
    if (!state) return true; // assume healthy until proven otherwise
    if (!state.hasData && state.failCount >= 3) return false;
    if (state.hasData && Date.now() - state.lastDataAt > STALE_THRESHOLD) return false;
    return true;
  };

  // Check if a panel's data is stale (> 3 minutes old)
  const isStale = (panelId: string): boolean => {
    const state = health[panelId];
    if (!state || !state.hasData) return false;
    return Date.now() - state.lastDataAt > 3 * 60_000;
  };

  // Get list of unhealthy panels
  const unhealthyPanels = Object.entries(health)
    .filter(([, state]) => !state.hasData && state.failCount >= 3)
    .map(([id]) => id);

  // Periodic check for stale data
  useEffect(() => {
    const id = setInterval(() => {
      setHealth(prev => {
        const now = Date.now();
        const updated = { ...prev };
        for (const [panelId, state] of Object.entries(updated)) {
          if (state.hasData && now - state.lastDataAt > STALE_THRESHOLD) {
            updated[panelId] = { ...state, hasData: false };
          }
        }
        return updated;
      });
    }, CHECK_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return { reportData, reportFail, isHealthy, isStale, unhealthyPanels };
}
