import { memo, useMemo } from 'react';
import styles from './Sparkline.module.css';

interface Props {
  /** Numeric samples in time order. Oldest first, newest last. */
  points: number[];
  /** Line color. Any CSS color value. Defaults to --green. */
  color?: string;
  /** Drop-shadow glow on the line. Default true. */
  glow?: boolean;
  /** Pulsing dot at the newest sample. Default false. */
  showLatest?: boolean;
  /** Fixed [min, max] domain, or 'auto' to compute from points. Default 'auto'. */
  domain?: [number, number] | 'auto';
  /** Stroke width in pixels. Default 1. */
  strokeWidth?: number;
  /** Minimum samples before rendering the real line. Below this, skeleton is shown. Default 2. */
  minPoints?: number;
  /** Accessible label read by screen readers. */
  ariaLabel?: string;
}

/**
 * Sparkline: the motion primitive for "rate of change over time".
 * Renders points as a polyline in a 0-100 × 0-100 viewBox, stretched by the
 * parent via width/height. Stroke is non-scaling so the line stays crisp at
 * any size. On low data it falls back to a dashed skeleton; the caller is
 * responsible for states beyond low-data (stale, error) via StateChip.
 */
function SparklineInner({
  points,
  color = 'var(--green)',
  glow = true,
  showLatest = false,
  domain = 'auto',
  strokeWidth = 1,
  minPoints = 2,
  ariaLabel,
}: Props) {
  const computed = useMemo(() => {
    if (points.length < minPoints) return null;

    let lo: number;
    let hi: number;
    if (domain === 'auto') {
      lo = points[0];
      hi = points[0];
      for (const v of points) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    } else {
      [lo, hi] = domain;
    }
    const range = hi - lo || 1;

    const step = 100 / (points.length - 1);
    const pts = points
      .map((v, i) => {
        const x = i * step;
        const y = 100 - ((v - lo) / range) * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');

    const last = points[points.length - 1];
    const lastY = 100 - ((last - lo) / range) * 100;

    return { pts, lastY };
  }, [points, domain, minPoints]);

  if (!computed) {
    return (
      <div className={`${styles.root} ${styles.skeleton}`} role="img" aria-label={ariaLabel ?? 'collecting data'}>
        <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
          <line className={styles.skeletonLine} x1="0" y1="50" x2="100" y2="50" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    );
  }

  return (
    <div className={styles.root} role="img" aria-label={ariaLabel ?? 'sparkline'}>
      <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ color }}>
        <polyline
          className={`${styles.line} ${glow ? styles.lineGlow : ''}`}
          points={computed.pts}
          stroke={color}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
        {showLatest && (
          <circle className={styles.tip} cx="100" cy={computed.lastY.toFixed(2)} r="1.6" fill={color} />
        )}
      </svg>
    </div>
  );
}

export const Sparkline = memo(SparklineInner);
