import { memo, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useBtcPrice } from '../hooks/useBtcPrice';
import type { PriceTick } from '../hooks/useBtcPrice';
import { useCoinbaseTrades } from '../hooks/useCoinbaseTrades';
import type { BtcTrade } from '../hooks/useCoinbaseTrades';
import { PanelHead } from './PanelHead';
import { LatencyChip } from './LatencyChip';
import { CountUp } from '../primitives';
import { BtcRollerCoaster } from './BtcRollerCoaster';
import type { LayoutManager } from '../hooks/useLayoutManager';
import styles from './BtcHero.module.css';

interface Props {
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

const STALE_WINDOW_MS = 10 * 60_000;
const WATCHDOG_MS = 5_000; // "NO TICK" chip appears after 5s of silence

function formatCompact(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function TradeTape({ trades }: { trades: BtcTrade[] }) {
  // Size tiers drive visual weight: a 1 BTC print should hit the eye harder
  // than a 0.01 BTC print. Tier thresholds tuned for the post-dust-filter
  // distribution where the smallest visible trade is 0.01 BTC (~$770).
  function sizeTier(btc: number): 'small' | 'medium' | 'large' {
    if (btc >= 0.5) return 'large';
    if (btc >= 0.1) return 'medium';
    return 'small';
  }
  function fmtSize(btc: number): string {
    if (btc >= 10) return btc.toFixed(1);
    if (btc >= 1) return btc.toFixed(2);
    return btc.toFixed(3);
  }
  return (
    <div className={styles.tape}>
      <div className={styles.tapeLabel}>
        <span>TAPE · COINBASE · &ge;0.01 BTC</span>
        <span>{trades.length > 0 ? `${trades.length} prints` : 'waiting'}</span>
      </div>
      {trades.length === 0 ? (
        <div className={styles.tapeEmpty}>awaiting fills...</div>
      ) : (
        <div className={styles.tapeList}>
          {trades.map((t, i) => {
            const sideClass = t.side === 'buy' ? styles.tapeBuy : styles.tapeSell;
            const tier = sizeTier(t.size ?? 0);
            const tierClass = tier === 'large' ? styles.tapeLarge : tier === 'medium' ? styles.tapeMedium : styles.tapeSmall;
            const arrow = t.side === 'buy' ? '▲' : '▼';
            const price = (t.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
            return (
              <span key={`${t.time}-${i}`} className={`${styles.tapeRow} ${sideClass} ${tierClass}`}>
                <span>{arrow}</span>
                <span>${price}</span>
                <span className={styles.tapeSize}>{fmtSize(t.size ?? 0)} BTC</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ChartProps {
  ticks: PriceTick[];
  hostRef?: RefObject<HTMLDivElement | null>;
  pathRef?: RefObject<SVGPathElement | null>;
}

function HeroChart({ ticks, hostRef, pathRef }: ChartProps) {
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
    <div className={styles.chart} ref={hostRef}>
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
        <path d={dFill} fill="url(#btcHeroGrad)" className={styles.areaFill} />
        <path ref={pathRef} d={d} fill="none" stroke="var(--gold)" strokeWidth="1.4" />
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
  const trades = useCoinbaseTrades();
  const [paused, setPaused] = useState(false);
  const [noTick, setNoTick] = useState(false);
  const chartHostRef = useRef<HTMLDivElement | null>(null);
  const chartPathRef = useRef<SVGPathElement | null>(null);

  // Watchdog: show a "NO TICK" chip when nothing has updated in WATCHDOG_MS
  useEffect(() => {
    const check = () => {
      const last = data?.lastUpdate ?? 0;
      const silent = last > 0 && Date.now() - last > WATCHDOG_MS;
      setNoTick(prev => (prev === silent ? prev : silent));
    };
    check();
    const iv = setInterval(check, 1000);
    return () => clearInterval(iv);
  }, [data?.lastUpdate]);

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

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <PanelHead panelId="bitcoin" isStale={isStale} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Bitcoin</span>
          <span className="panelTag">BTC/USD</span>
          {data?.source && <span className="panelTagDim">{data.source}</span>}
          <a
            href="/bitcoin-ticker"
            style={{ fontSize: 9, color: 'var(--text-dim)', marginLeft: 8, textDecoration: 'none', letterSpacing: '0.5px' }}
            title="Bitcoin Ticker landing page"
          >
            BITCOIN TICKER &rarr;
          </a>
        </div>
        <div className="panelLive" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <LatencyChip lastUpdateMs={data?.lastUpdate ?? null} label="TICK" />
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
          <span className={styles.price}>
            <CountUp
              value={price}
              prefix="$"
              decimals={2}
              minDecimals={2}
              flashOnChange={!paused}
              ariaLabel="Bitcoin price in USD"
            />
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
          <TradeTape trades={trades} />
        </div>
        <div style={{ position: 'relative' }}>
          {noTick && !isStale && <span className={styles.watchdog}>NO TICK</span>}
          <HeroChart ticks={priceHistory} hostRef={chartHostRef} pathRef={chartPathRef} />
          <BtcRollerCoaster pathRef={chartPathRef} hostRef={chartHostRef} ticks={priceHistory} />
        </div>
      </div>
    </div>
  );
});
