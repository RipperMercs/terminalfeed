// Panel Health Monitor: tracks which panels have working data
// Panels with no data after timeout become "unhealthy" and can be
// auto-hidden from the grid, then restored when data returns.

import { useState, useEffect, useRef, useCallback } from 'react';

interface PanelHealthState {
  [panelId: string]: {
    hasData: boolean;
    lastDataAt: number;
    failCount: number;
  };
}

const STALE_THRESHOLD = 5 * 60_000; // 5 min: if no data for 5 min, consider unhealthy
const CHECK_INTERVAL = 30_000; // check every 30s
// A still-fresh panel is re-stamped at most this often. This is the guard that
// makes reportData idempotent within the window, so a caller in the render path
// (the panel-health reporting effect runs on every commit) cannot drive an
// infinite setState -> re-render -> setState loop. Must stay well below the
// isStale (3 min) and STALE_THRESHOLD (5 min) windows so live panels never trip.
const REFRESH_WINDOW = 15_000;

export function usePanelHealth() {
  const [health, setHealth] = useState<PanelHealthState>({});
  const healthRef = useRef(health);
  healthRef.current = health;

  // Report that a panel has data. Idempotent within REFRESH_WINDOW: if the panel
  // is already fresh and was stamped recently, return the SAME state object so
  // React bails the update. Without this guard the reporting effect (which has
  // no dependency array and runs on every commit) re-stamps a fresh Date.now()
  // each render and loops until React throws "Maximum update depth exceeded".
  const reportData = useCallback((panelId: string) => {
    setHealth(prev => {
      const cur = prev[panelId];
      if (cur && cur.hasData && cur.failCount === 0 && Date.now() - cur.lastDataAt < REFRESH_WINDOW) {
        return prev; // already fresh and recently stamped: no-op, breaks the loop
      }
      return {
        ...prev,
        [panelId]: { hasData: true, lastDataAt: Date.now(), failCount: 0 },
      };
    });
  }, []);

  // Report that a panel fetch failed
  const reportFail = useCallback((panelId: string) => {
    setHealth(prev => {
      const current = prev[panelId] || { hasData: false, lastDataAt: 0, failCount: 0 };
      return {
        ...prev,
        [panelId]: { ...current, failCount: current.failCount + 1 },
      };
    });
  }, []);

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

  // When the panel last received data (epoch ms), or null if it never has.
  // Returned even after the panel is flagged unhealthy, so the "as of" label can
  // keep showing the aging timestamp rather than vanishing (the age IS the signal).
  const lastDataAt = (panelId: string): number | null => {
    const state = health[panelId];
    return state && state.lastDataAt ? state.lastDataAt : null;
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

  return { reportData, reportFail, isHealthy, isStale, lastDataAt, unhealthyPanels };
}
