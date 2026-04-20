import { memo } from 'react';
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
}

const DEFAULT_TEXT: Record<StateChipKind, string> = {
  collecting: 'Collecting',
  waiting: 'Waiting',
  error: 'Error',
  empty: 'No Data',
  stale: 'Stale',
};

function StateChipInner({ kind, label, message, count, needed, block }: Props) {
  let text = message ?? DEFAULT_TEXT[kind];

  // Collecting progress: override text with a count/needed readout when both are provided
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
