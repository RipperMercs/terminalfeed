import { useRef, useEffect, useCallback } from 'react';
import type { PriceTick } from '../hooks/useBtcPrice';

interface LiveChartProps {
  ticks: PriceTick[];
  height: number;
  color: string;
}

export function LiveChart({ ticks, height, color }: LiveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const widthRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || ticks.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = widthRef.current;
    const h = height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, w, h);

    const prices = ticks.map((t) => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const padTop = 20;
    const padBottom = 18;
    const chartH = h - padTop - padBottom;

    // Compute points
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < ticks.length; i++) {
      const x = (i / (ticks.length - 1)) * w;
      const y = padTop + chartH - ((ticks[i].price - min) / range) * chartH;
      points.push({ x, y });
    }

    // Parse color for rgba
    const isGreen = color.includes('4ADE80') || color.includes('green');
    const r = isGreen ? 74 : 248;
    const g = isGreen ? 222 : 113;
    const b = isGreen ? 128 : 113;

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padTop, 0, h);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.12)`);
    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.03)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    // Fill area
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, h);
    ctx.lineTo(points[0].x, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Glow effect on the line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Current price dot (pulsing)
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fill();

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Price labels
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(62, 62, 58, 0.8)';
    ctx.textAlign = 'left';

    // Max price label
    ctx.fillText(`$${max.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 4, padTop - 4);

    // Min price label
    ctx.fillText(`$${min.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 4, h - padBottom + 12);

    // Current price on right
    ctx.textAlign = 'right';
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
    const currentLabel = `$${ticks[ticks.length - 1].price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    ctx.fillText(currentLabel, w - 4, last.y - 6);

    // Horizontal dotted line at current price
    ctx.beginPath();
    ctx.setLineDash([2, 3]);
    ctx.moveTo(0, last.y);
    ctx.lineTo(w - 60, last.y);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Time span label
    const spanSec = (ticks[ticks.length - 1].time - ticks[0].time) / 1000;
    const spanLabel = spanSec < 60 ? `${Math.round(spanSec)}s` : `${Math.round(spanSec / 60)}m`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(62, 62, 58, 0.6)';
    ctx.fillText(spanLabel, w - 4, h - 4);

    // Tick count
    ctx.textAlign = 'left';
    ctx.fillText(`${ticks.length} ticks`, 4, h - 4);
  }, [ticks, height, color]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        widthRef.current = entry.contentRect.width;
        draw();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  // Redraw on new ticks
  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  if (ticks.length < 2) {
    return (
      <div
        ref={containerRef}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: 'var(--text-dim)',
          letterSpacing: 2,
        }}
      >
        AWAITING LIVE DATA...
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height }}
      />
    </div>
  );
}
