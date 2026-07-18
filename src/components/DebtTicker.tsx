// Live-estimating US debt counter: base value from the last Treasury business
// day plus per-second accrual. Ticks locally every second; the interval state
// is isolated here so the parent dashboard does not re-render per tick.

import { memo, useEffect, useState } from 'react';

interface Props {
  total: number;
  perSecond: number;
  asOfMs: number;
}

export const DebtTicker = memo(function DebtTicker({ total, perSecond, asOfMs }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const estimated = total + Math.max(0, (now - asOfMs) / 1000) * perSecond;
  return (
    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)', fontFamily: 'monospace', letterSpacing: '0.5px', fontVariantNumeric: 'tabular-nums' }}>
      ${Math.floor(estimated).toLocaleString()}
    </div>
  );
});
