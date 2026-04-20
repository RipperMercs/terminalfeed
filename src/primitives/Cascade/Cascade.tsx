import { memo } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import styles from './Cascade.module.css';

export interface CascadeEvent {
  /** Stable id — only new ids replay the fall-in animation. */
  id: string | number;
  /** Optional per-line accent color for the left-edge flash during entry. */
  accent?: string;
}

interface Props<T extends CascadeEvent> {
  /** Event list in display order. Newest first at index 0 is the typical convention. */
  events: T[];
  /** Cap on visible rows. Slices events from the top. */
  maxLines?: number;
  /** Caller-provided row renderer. Primitive wraps it with the cascade animation. */
  renderLine: (event: T) => ReactNode;
  /** Accessible label for screen readers. */
  ariaLabel?: string;
  /** Default accent color for the entry flash when an event doesn't specify one. */
  defaultAccent?: string;
}

/**
 * Cascade — the motion primitive for "event stream where recency matters".
 * Each row runs a fall-in animation with a colored edge-flash exactly once
 * on mount. Stable event ids are essential — if a caller uses array indices
 * as keys, every row re-animates on every new event and the effect falls
 * apart.
 */
function CascadeInner<T extends CascadeEvent>({
  events,
  maxLines,
  renderLine,
  ariaLabel,
  defaultAccent = 'rgba(96, 165, 250, 0.6)',
}: Props<T>) {
  const visible = typeof maxLines === 'number' ? events.slice(0, maxLines) : events;

  return (
    <div className={styles.root} role="log" aria-label={ariaLabel ?? 'event stream'} aria-live="polite">
      {visible.map(ev => {
        const style = { ['--cascade-accent' as string]: ev.accent ?? defaultAccent } as CSSProperties;
        return (
          <div key={ev.id} className={styles.line} style={style}>
            {renderLine(ev)}
          </div>
        );
      })}
    </div>
  );
}

// memo with generic component — cast through unknown to preserve the type parameter.
export const Cascade = memo(CascadeInner) as typeof CascadeInner;
