import { useEffect, useState } from 'react';

// Simulated terminal count with organic-feeling fluctuations
// Base range: 1,700 - 4,978
// Fluctuates naturally based on time of day (higher during US/EU business hours)

function getBaseCount(): number {
  const hour = new Date().getUTCHours();

  // Simulate daily traffic pattern (UTC)
  // Peak: 14-22 UTC (US daytime + EU evening)
  // Low: 4-10 UTC (overnight US)
  if (hour >= 14 && hour <= 22) return 3200 + Math.floor(Math.random() * 1500); // peak: 3200-4700
  if (hour >= 10 && hour < 14) return 2400 + Math.floor(Math.random() * 1200);  // EU morning: 2400-3600
  if (hour >= 22 || hour < 2) return 2000 + Math.floor(Math.random() * 1000);   // evening: 2000-3000
  return 1700 + Math.floor(Math.random() * 800);                                 // overnight: 1700-2500
}

export function useTerminalsOnline(): number {
  const [count, setCount] = useState(() => getBaseCount());

  useEffect(() => {
    // Small fluctuations every 8-15 seconds to feel alive
    const tick = () => {
      setCount(prev => {
        // Drift by -30 to +30 from current
        const drift = Math.floor(Math.random() * 61) - 30;
        const base = getBaseCount();
        // Blend: 80% stay near current, 20% pull toward base
        const blended = Math.round(prev * 0.8 + base * 0.2) + drift;
        // Clamp to 1700-4978
        return Math.max(1700, Math.min(4978, blended));
      });
    };

    const interval = setInterval(tick, 8000 + Math.floor(Math.random() * 7000));
    return () => clearInterval(interval);
  }, []);

  return count;
}
