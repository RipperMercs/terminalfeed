import { memo, useEffect, useState } from 'react';
import styles from './StateChip.module.css';

export type StateChipKind = 'collecting' | 'waiting' | 'error' | 'empty' | 'stale';

interface Props {
  /** What state is this chip reporting. Drives color + animation. */
  kind: StateChipKind;
  /** Optional short source label (e.g. "USGS", "HN"). Rendered before the state text. */
  label?: string;
  /** Optional custom message. Overrides the default text for the kind. */
  message?: string;
  /** For kind="collecting": how many samples we have so far. */
  count?: number;
  /** For kind="collecting": how many samples we need before full render. */
  needed?: number;
  /** If true, centers the chip inside a padded block (panel body fallback). */
  block?: boolean;
  /** Auto-hide after N ms if still mounted. 0 disables. Default 12000 for `waiting`, 0 otherwise. */
  hideAfterMs?: number;
}

const DEFAULT_TEXT: Record<StateChipKind, string> = {
  collecting: 'Collecting',
  waiting: 'Waiting',
  error: 'Error',
  empty: 'No Data',
  stale: 'Stale',
};

function StateChipInner({ kind, label, message, count, needed, block, hideAfterMs }: Props) {
  const effectiveTimeout = hideAfterMs ?? (kind === 'waiting' ? 12000 : 0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (effectiveTimeout <= 0) return;
    const t = setTimeout(() => setHidden(true), effectiveTimeout);
    return () => clearTimeout(t);
  }, [effectiveTimeout]);

  if (hidden) return null;

  let text = message ?? DEFAULT_TEXT[kind];

  if (kind === 'collecting' && typeof count === 'number' && typeof needed === 'number' && !message) {
    text = `Collecting ${count}/${needed}`;
  }

  const chip = (
    <span className={`${styles.chip} ${styles[kind]}`} role="status">
      <span className={styles.dot} aria-hidden="true" />
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.message}>{text}</span>
    </span>
  );

  if (block) {
    return <div className={styles.block}>{chip}</div>;
  }

  return chip;
}

export const StateChip = memo(StateChipInner);
