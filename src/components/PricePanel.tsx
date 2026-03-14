import { useRef, useEffect } from 'react';
import { Panel } from './Panel';
import type { PriceTick } from '../hooks/useBtcPrice';
import styles from './PricePanel.module.css';

interface PricePanelProps {
  price: number;
  prevPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  connected: boolean;
  priceHistory: PriceTick[];
}

export function PricePanel({
  price,
  prevPrice,
  change24h,
  changePercent24h,
  high24h,
  low24h,
  volume24h,
  marketCap,
  connected,
  priceHistory,
}: PricePanelProps) {
  const priceRef = useRef<HTMLDivElement>(null);
  const direction = price >= prevPrice ? 'up' : 'down';

  useEffect(() => {
    if (!priceRef.current) return;
    priceRef.current.classList.remove(styles.flashUp, styles.flashDown);
    // Force reflow
    void priceRef.current.offsetWidth;
    priceRef.current.classList.add(
      direction === 'up' ? styles.flashUp : styles.flashDown,
    );
  }, [price, direction]);

  const isUp = change24h >= 0;
  const arrow = isUp ? '\u25B2' : '\u25BC';

  return (
    <Panel title="BTC / USD" status={connected ? 'live' : 'offline'}>
      <div ref={priceRef} className={styles.priceRow}>
        <span className={styles.price}>
          ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`${styles.change} ${isUp ? styles.up : styles.down}`}>
          {arrow} {Math.abs(changePercent24h).toFixed(2)}%
        </span>
      </div>

      {/* Sparkline */}
      <div className={styles.chartContainer}>
        {priceHistory.length >= 2 ? (
          <Sparkline ticks={priceHistory} up={isUp} />
        ) : (
          <div className={styles.chartWaiting}>awaiting data...</div>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>24h High</span>
          <span className={styles.statValue}>
            ${high24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>24h Low</span>
          <span className={styles.statValue}>
            ${low24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>24h Vol</span>
          <span className={styles.statValue}>
            ${formatCompact(volume24h)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Mkt Cap</span>
          <span className={styles.statValue}>
            ${formatCompact(marketCap)}
          </span>
        </div>
      </div>
    </Panel>
  );
}

function Sparkline({ ticks, up }: { ticks: PriceTick[]; up: boolean }) {
  const prices = ticks.map((t) => t.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const w = 100; // viewBox %
  const h = 50;
  const padY = 4;
  const chartH = h - padY * 2;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = padY + chartH - ((p - min) / range) * chartH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const line = `M${points.join(' L')}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  const color = up ? 'var(--green)' : 'var(--red)';
  const fillId = up ? 'sparkGreen' : 'sparkRed';

  // Time label
  const spanSec = (ticks[ticks.length - 1].time - ticks[0].time) / 1000;
  const spanLabel = spanSec < 60 ? `${Math.round(spanSec)}s` : `${Math.round(spanSec / 60)}m`;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="80px">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${fillId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
      </svg>
      <span style={{
        position: 'absolute',
        bottom: 2,
        right: 4,
        fontSize: '8px',
        color: 'var(--text-dim)',
        letterSpacing: '0.5px',
      }}>
        {spanLabel}
      </span>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}
