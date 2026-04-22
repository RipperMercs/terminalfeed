import { memo, useEffect, useState } from 'react';
import styles from './LatencyChip.module.css';

interface Props {
  /** Millisecond timestamp of the most recent data arrival. Null = unknown. */
  lastUpdateMs: number | null | undefined;
  /** Optional prefix, e.g. "TICK" or "EVENT". Defaults to no label. */
  label?: string;
  /** Override the fresh/warm boundary (default 5s). */
  warmThresholdMs?: number;
  /** Override the warm/cold boundary (default 30s). */
  coldThresholdMs?: number;
}

function formatAge(ageMs: number): string {
  if (ageMs < 1000) return 'now';
  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export const LatencyChip = memo(function LatencyChip({
  lastUpdateMs,
  label,
  warmThresholdMs = 5000,
  coldThresholdMs = 30000,
}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!lastUpdateMs || lastUpdateMs <= 0) {
    return (
      <span className={`${styles.chip} ${styles.unknown}`}>
        {label && <span className={styles.label}>{label}</span>}
        <span>-</span>
      </span>
    );
  }

  const ageMs = Math.max(0, now - lastUpdateMs);
  const tier =
    ageMs < warmThresholdMs ? styles.fresh :
    ageMs < coldThresholdMs ? styles.warm :
                              styles.cold;

  return (
    <span className={`${styles.chip} ${tier}`}>
      <span className={styles.dot} aria-hidden="true" />
      {label && <span className={styles.label}>{label}</span>}
      <span>{formatAge(ageMs)}</span>
    </span>
  );
});
