import { memo, useId } from 'react';
import type { CSSProperties } from 'react';
import styles from './Dial.module.css';

interface Props {
  /** Current value on the dial. */
  value: number;
  /** Low end of the bounded range. Needle is pegged here when value <= min. */
  min: number;
  /** High end of the bounded range. Needle is pegged here when value >= max. */
  max: number;
  /** Gradient stops along the arc. At least 2 required. */
  gradient?: { offset: string; color: string }[];
  /** Visible value display below the arc. Provide the number as rendered string. */
  label?: string;
  /** Unit suffix for the value label. */
  unit?: string;
  /** Enable the continuous ±1.2° jitter on the needle for "alive" feel. */
  jitter?: boolean;
  /** Accessible label. */
  ariaLabel?: string;
}

const DEFAULT_GRADIENT = [
  { offset: '0%', color: 'var(--green)' },
  { offset: '50%', color: 'var(--amber)' },
  { offset: '100%', color: 'var(--red)' },
];

/**
 * Dial: semicircle gauge primitive for bounded scalar readings.
 * Fills an arc from the left to the current angle, shows a white
 * needle at the current position, and jitters the needle subtly by
 * default. The endpoint of the progress arc is computed with proper
 * trig so the stroke sits on the 80-radius circle (the naive linear
 * interpolation produces a distorted arc: see fix commit 5d8f542).
 */
function DialInner({
  value,
  min,
  max,
  gradient = DEFAULT_GRADIENT,
  label,
  unit,
  jitter = true,
  ariaLabel,
}: Props) {
  const gradId = useId().replace(/:/g, '-');
  const range = max - min || 1;
  const clamped = Math.max(min, Math.min(max, value));
  const fraction = (clamped - min) / range;
  const angleDeg = -90 + fraction * 180;
  const theta = Math.PI * (1 - fraction);
  const arcEndX = 100 + 80 * Math.cos(theta);
  const arcEndY = 100 - 80 * Math.sin(theta);

  const rootStyle = { ['--dial-angle' as string]: `${angleDeg}deg` } as CSSProperties;
  const needleClass = `${styles.needle} ${jitter ? styles.needleJitter : ''}`;

  return (
    <div className={styles.root} style={rootStyle} role="meter" aria-label={ariaLabel ?? 'dial'} aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}>
      <div className={styles.svgWrap}>
        <svg viewBox="0 0 200 115" preserveAspectRatio="xMidYMid meet" className={styles.svg}>
          <defs>
            <linearGradient id={gradId} x1="0" x2="1">
              {gradient.map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={`url(#${gradId})`} strokeWidth="6" opacity="0.25" />
          <path
            d={`M 20 100 A 80 80 0 0 1 ${arcEndX.toFixed(2)} ${arcEndY.toFixed(2)}`}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <line className={needleClass} x1="100" y1="100" x2="100" y2="35" stroke="var(--text)" strokeWidth="2" />
          <circle cx="100" cy="100" r="4" fill="var(--text)" />
        </svg>
      </div>
      {label !== undefined && (
        <div className={styles.value}>
          {label}
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>
      )}
    </div>
  );
}

export const Dial = memo(DialInner);
