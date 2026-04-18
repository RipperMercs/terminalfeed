import { memo, useEffect, useRef, useState } from 'react';
import { useBtcPrice } from '../hooks/useBtcPrice';
import type { PriceTick } from '../hooks/useBtcPrice';
import { PanelHead } from './PanelHead';
import type { LayoutManager } from '../hooks/useLayoutManager';
import styles from './BtcHero.module.css';

interface Props {
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

const STALE_WINDOW_MS = 10 * 60_000;
const FLASH_MS = 700;

function formatCompact(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

interface ChartProps {
  ticks: PriceTick[];
}

function HeroChart({ ticks }: ChartProps) {
  if (!ticks || ticks.length < 2) {
    return <div className={styles.chartEmpty}>loading chart...</div>;
  }
  const W = 600;
  const H = 180;
  const prices = ticks.map(t => t.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const step = W / (prices.length - 1);
  const pts = prices.map((p, i) => [i * step, H - ((p - min) / range) * (H - 14) - 7]);
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const dFill = d + ` L${W},${H} L0,${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <div className={styles.chart}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="btcHeroGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--gold)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1="0" x2={W} y1={H * p} y2={H * p}
                stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 3" />
        ))}
        <path d={dFill} fill="url(#btcHeroGrad)" />
        <path d={d} fill="none" stroke="var(--gold)" strokeWidth="1.4" />
        <circle cx={last[0]} cy={last[1]} r="2.5" className={styles.pulseDot} />
        <circle cx={last[0]} cy={last[1]} r="5" fill="var(--gold)" opacity="0.3">
          <animate attributeName="r"       values="2.5;10;2.5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5"  dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

export const BtcHero = memo(function BtcHero({ layout, panelHealth, getGridCols }: Props) {
  const { data, priceHistory } = useBtcPrice();
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState<'up' | 'dn' | null>(null);
  const prevPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const price = data?.price;
    if (typeof price !== 'number' || price <= 0) return;
    const prev = prevPriceRef.current;
    if (prev !== null && prev !== price) {
      setFlash(price > prev ? 'up' : 'dn');
      const t = setTimeout(() => setFlash(null), FLASH_MS);
      prevPriceRef.current = price;
      return () => clearTimeout(t);
    }
    prevPriceRef.current = price;
  }, [data?.price, paused]);

  const healthStale = panelHealth.isStale('bitcoin');
  const dataStale =
    data?.source === 'static' ||
    (typeof data?.lastUpdate === 'number' && Date.now() - data.lastUpdate > STALE_WINDOW_MS);
  const isStale = healthStale || dataStale;

  const price = data?.price ?? 0;
  const changePct = data?.changePercent24h ?? 0;
  const isUp = changePct >= 0;
  const high = data?.high24h ?? price;
  const low = data?.low24h ?? price;
  const volume = data?.volume24h ?? 0;
  const range = high - low || 1;
  const markerPct = Math.max(0, Math.min(100, ((price - low) / range) * 100));

  const flashClass = flash === 'up' ? styles.flashUp : flash === 'dn' ? styles.flashDn : '';

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <PanelHead panelId="bitcoin" isStale={isStale} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Bitcoin</span>
          <span className="panelTag">BTC/USD</span>
          {data?.source && <span className="panelTagDim">{data.source}</span>}
        </div>
        <div className="panelLive">
          {isStale ? (<>
            <span className="liveDot" style={{ background: 'var(--amber)' }} />
            <span className="liveText" style={{ color: 'var(--amber)' }}>STALE</span>
          </>) : (<>
            <span className="liveDot" style={{ background: price > 0 ? 'var(--green)' : 'var(--red)' }} />
            <span className="liveText">{price > 0 ? 'LIVE' : 'LOADING'}</span>
          </>)}
        </div>
      </PanelHead>

      {isStale && data?.source === 'static' && (
        <div className={styles.staleBanner}>
          Unable to connect to live feeds. Showing approximate data. Check your network or ad blocker.
        </div>
      )}

      <div className={styles.heroGrid}>
        <div className={styles.left}>
          <span className={`${styles.price} ${flashClass}`}>
            ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`${styles.change} ${isUp ? styles.up : styles.dn}`}>
            {isUp ? '\u25B2' : '\u25BC'} {Math.abs(changePct).toFixed(2)}% today
          </span>
          <div className={styles.subRow}>
            <span>24H HIGH <b>${high.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b></span>
            <span>24H LOW  <b>${low.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b></span>
            {volume > 0 && <span>VOL <b>${formatCompact(volume)}</b></span>}
          </div>
          <div className={styles.rangeBar}>
            <div className={styles.rangeLabel}>
              <span>${low.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className={styles.liveMarker}>{'\u25CF'} LIVE</span>
              <span>${high.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className={styles.rangeTrack}>
              <div className={styles.rangeFill} />
              <div className={styles.rangeMarker} style={{ left: markerPct + '%' }} />
            </div>
          </div>
        </div>
        <HeroChart ticks={priceHistory} />
      </div>
    </div>
  );
});
