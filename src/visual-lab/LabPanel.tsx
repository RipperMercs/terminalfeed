import { useState, type ReactNode } from 'react';
import { CATEGORY_COLOR, CATEGORY_LABEL, type Category } from './labData';
import styles from './LabPanel.module.css';

export type Variant =
  | 'default'
  | 'bloomberg'
  | 'brackets'
  | 'header-strip'
  | 'glow'
  | 'matrix'
  | 'lcars'
  | 'command'
  | 'prod-brackets'
  | 'prod-ticks'
  | 'prod-header'
  | 'prod-full';

interface Props {
  title: string;
  category: Category;
  status?: 'live' | 'polling' | 'offline';
  children: ReactNode;
}

// Variant is read off the closest [data-variant] ancestor (the lab page sets it).
// That way one click on the variant switcher restyles every panel at once.
export function LabPanel({ title, category, status = 'live', children }: Props) {
  const accent = CATEGORY_COLOR[category];
  const tag = CATEGORY_LABEL[category];

  // Per-panel random animation offset (negative delay means the keyframe
  // timeline starts mid-cycle). This breaks the visual sync where every
  // panel's pulse fires in lockstep at mount. Stable across re-renders.
  const [animOffset] = useState(() => -Math.random() * 4);

  return (
    <div
      className={styles.panel}
      data-category={category}
      style={{
        '--accent': accent,
        '--anim-offset': `${animOffset}s`,
      } as React.CSSProperties}
    >
      {/* Header strip variant: thin colored bar above the header */}
      <div className={styles.topStrip} aria-hidden />

      {/* Scanline overlay (matrix + command variants) */}
      <div className={styles.scanline} aria-hidden />

      {/* Corner brackets variant: 4 L-shapes positioned at corners */}
      <span className={`${styles.bracket} ${styles.bracketTL}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.bracketTR}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.bracketBL}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.bracketBR}`} aria-hidden />

      {/* LCARS-style segmented vertical bar (lcars variant only) */}
      <div className={styles.lcarsBar} aria-hidden>
        <span className={styles.lcarsSeg} />
        <span className={styles.lcarsSeg} />
        <span className={styles.lcarsSeg} />
        <span className={styles.lcarsSeg} />
      </div>

      <div className={styles.header}>
        <span className={styles.titleWrap}>
          <span className={styles.lcarsPill} aria-hidden />
          <span className={styles.tag}>[{tag}]</span>
          <span className={styles.title}>{title}</span>
        </span>
        <span className={`${styles.status} ${styles[status]}`}>
          <span className={styles.dot} />
          {status}
          <span className={styles.tickCounter} aria-hidden>
            <span className={styles.tickDot} />
            <span className={styles.tickDot} />
            <span className={styles.tickDot} />
          </span>
        </span>
      </div>

      <div className={styles.body}>{children}</div>
    </div>
  );
}
