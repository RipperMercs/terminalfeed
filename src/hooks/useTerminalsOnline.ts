import { useEffect, useState } from 'react';

// Simulated terminal count with consistent, realistic behavior
// Uses hour-of-day as a seed so refreshing gives a similar number
// Real users will be added on top when analytics are wired up

function hashHour(): number {
  // Create a stable seed from the current hour (changes hourly, not on refresh)
  const now = new Date();
  const seed = now.getFullYear() * 1000000 + (now.getMonth() + 1) * 10000 + now.getDate() * 100 + now.getUTCHours();
  // Simple hash to get a "random" but stable number for this hour
  let h = seed;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = (h >> 16) ^ h;
  return Math.abs(h);
}

function getBaseForHour(): number {
  const hour = new Date().getUTCHours();
  const hourHash = hashHour();

  // Base range varies by time of day (UTC)
  let low: number, high: number;
  if (hour >= 14 && hour <= 22) {
    low = 3000; high = 4200; // US daytime + EU evening = peak
  } else if (hour >= 10 && hour < 14) {
    low = 2400; high = 3400; // EU business hours
  } else if (hour >= 22 || hour < 2) {
    low = 1800; high = 2800; // late evening
  } else {
    low = 1200; high = 2200; // overnight
  }

  // Use the hour hash to pick a stable number within the range
  return low + (hourHash % (high - low));
}

export function useTerminalsOnline(): number {
  const [count, setCount] = useState(() => getBaseForHour());

  useEffect(() => {
    // Small gentle drift every 10-20 seconds
    // Only drifts ±5-15 from current: never jumps
    const tick = () => {
      setCount(prev => {
        const drift = Math.floor(Math.random() * 21) - 10; // -10 to +10
        const next = prev + drift;
        // Soft clamp: gently pull toward the hourly base if drifting too far
        const base = getBaseForHour();
        const maxDrift = 300;
        if (next > base + maxDrift) return prev - Math.floor(Math.random() * 8);
        if (next < base - maxDrift) return prev + Math.floor(Math.random() * 8);
        return Math.max(1200, Math.min(4798, next));
      });
    };

    const interval = setInterval(tick, 10000 + Math.floor(Math.random() * 10000));
    return () => clearInterval(interval);
  }, []);

  return count;
}
