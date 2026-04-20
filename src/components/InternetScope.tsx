import { memo, useEffect, useRef, useState } from 'react';

interface Props {
  avgLatencyMs: number | null;
}

// Oscilloscope render: phosphor-green compound sine wave on a dark grid.
// Amplitude modulates gently with avg latency so the trace feels tied to real
// health signal without being strictly a graph of it.
export const InternetScope = memo(function InternetScope({ avgLatencyMs }: Props) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const hiddenRef = useRef(false);

  useEffect(() => {
    const handleVisibility = () => { hiddenRef.current = document.hidden; };
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    let last = performance.now();
    const tick = (nowMs: number) => {
      const dt = (nowMs - last) / 1000;
      last = nowMs;
      if (!hiddenRef.current) setT(prev => prev + dt * 2.2);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Amplitude floor 14, add a little based on latency (clamp so it doesn't go wild)
  const latencyAmp = Math.min(10, Math.max(0, ((avgLatencyMs ?? 40) - 20) / 12));
  const amp = 14 + latencyAmp;

  const points: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = (i / 80) * 100;
    const y = 80 + Math.sin(i / 5 + t) * amp + Math.sin(i / 3 + t * 1.3) * (amp * 0.4);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  return (
    <div className="internetScope">
      <svg viewBox="0 0 100 160" preserveAspectRatio="none" className="internetScopeSvg">
        <g className="internetScopeGrid">
          {[0, 20, 40, 60, 80, 100].map(x => (
            <line key={'v' + x} x1={x} y1={0} x2={x} y2={160} />
          ))}
          {[0, 40, 80, 120, 160].map(y => (
            <line key={'h' + y} x1={0} y1={y} x2={100} y2={y} />
          ))}
        </g>
        <polyline
          className="internetScopeWave"
          points={points.join(' ')}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="internetScopeLabel">
        NET &middot; {avgLatencyMs !== null ? `${Math.round(avgLatencyMs)}ms` : '...'} avg
      </div>
    </div>
  );
});
