import { btcTicker, CATEGORY_COLOR } from './labData';
import styles from './LabBtcTicker.module.css';

function formatCompact(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(1)}M`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 600;
  const H = 90;
  const PAD = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = (W - PAD * 2) / (data.length - 1);
  const pts = data.map((p, i) => [
    PAD + i * step,
    H - PAD - ((p - min) / range) * (H - PAD * 2),
  ]);
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const dFill = d + ` L${W - PAD},${H} L${PAD},${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.spark}>
      <defs>
        <linearGradient id="lab-btc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dFill} fill="url(#lab-btc-fill)" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="6" fill={color} fillOpacity="0.25" />
    </svg>
  );
}

export function LabBtcTicker() {
  const accent = CATEGORY_COLOR.btc;
  const up = btcTicker.change24hPct >= 0;

  return (
    <div
      className={styles.hero}
      data-category="btc"
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <div className={styles.topStrip} aria-hidden />
      <span className={`${styles.bracket} ${styles.bracketTL}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.bracketTR}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.bracketBL}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.bracketBR}`} aria-hidden />

      <div className={styles.left}>
        <div className={styles.headerRow}>
          <span className={styles.tag}>[BTC]</span>
          <span className={styles.label}>BITCOIN · USD</span>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>LIVE</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.price}>
            ${btcTicker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={up ? styles.changeUp : styles.changeDown}>
            {up ? '▲' : '▼'} {Math.abs(btcTicker.change24hPct).toFixed(2)}%
            <span className={styles.changeAbs}>
              ({up ? '+' : '-'}${Math.abs(btcTicker.changeAbs).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </span>
          </span>
        </div>
        <div className={styles.statsRow}>
          <span className={styles.stat}><span className={styles.statKey}>24H HI</span> <span className={styles.statVal}>${btcTicker.high24h.toLocaleString()}</span></span>
          <span className={styles.divider} />
          <span className={styles.stat}><span className={styles.statKey}>24H LO</span> <span className={styles.statVal}>${btcTicker.low24h.toLocaleString()}</span></span>
          <span className={styles.divider} />
          <span className={styles.stat}><span className={styles.statKey}>VOL</span> <span className={styles.statVal}>${formatCompact(btcTicker.volume24h)}</span></span>
          <span className={styles.divider} />
          <span className={styles.stat}><span className={styles.statKey}>MCAP</span> <span className={styles.statVal}>${formatCompact(btcTicker.marketCap)}</span></span>
        </div>
      </div>

      <div className={styles.right}>
        <Sparkline data={btcTicker.spark} color={accent} />
      </div>
    </div>
  );
}
