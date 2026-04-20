import { memo, useEffect, useRef, useState } from 'react';
import styles from './CountUp.module.css';

interface Props {
  /** The current numeric value. Changes trigger the flash animation. */
  value: number;
  /** Prefix string (e.g. "$"). Not part of the animated number. */
  prefix?: string;
  /** Suffix string (e.g. "%"). Not part of the animated number. */
  suffix?: string;
  /** Decimal places for toLocaleString. Default 0. */
  decimals?: number;
  /** Show green-up / red-down flash when value changes. Default true. */
  flashOnChange?: boolean;
  /** Minimum decimals for toLocaleString. Defaults to decimals. */
  minDecimals?: number;
  /** Accessible label. */
  ariaLabel?: string;
}

const FLASH_MS = 700;

/**
 * CountUp — formatted number that flashes green or red on change.
 * Composes with Sparkline and LatencyChip in hero tiles (BTC price,
 * stocks, counters). Digit-roll animation is a future enhancement;
 * today's implementation is the flash-on-change variant that matches
 * the dashboard's existing price-change treatment.
 */
function CountUpInner({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  flashOnChange = true,
  minDecimals,
  ariaLabel,
}: Props) {
  const prevRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'dn' | null>(null);

  useEffect(() => {
    if (!flashOnChange) return;
    const prev = prevRef.current;
    if (prev !== null && prev !== value && Number.isFinite(value) && Number.isFinite(prev)) {
      setFlash(value > prev ? 'up' : 'dn');
      const t = setTimeout(() => setFlash(null), FLASH_MS);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
    prevRef.current = value;
  }, [value, flashOnChange]);

  const formatted = Number.isFinite(value)
    ? value.toLocaleString(undefined, {
        minimumFractionDigits: minDecimals ?? decimals,
        maximumFractionDigits: decimals,
      })
    : '—';

  const cls =
    flash === 'up' ? `${styles.root} ${styles.flashUp}`
    : flash === 'dn' ? `${styles.root} ${styles.flashDn}`
    : styles.root;

  return (
    <span className={cls} aria-label={ariaLabel}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

export const CountUp = memo(CountUpInner);
