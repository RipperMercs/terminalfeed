// Signal chips under the ticker: one per active anomaly, colored by severity.
// Clicking a chip jumps to (and briefly highlights) the panel where the story
// is. Renders nothing at all on quiet days, so no dead space.

import { memo } from 'react';
import type { Signal } from '../hooks/useSignals';

interface Props {
  signals: Signal[];
  onJump: (panelId: string) => void;
}

const SEVERITY_CLASS: Record<string, string> = {
  notice: 'signalNotice',
  elevated: 'signalElevated',
  critical: 'signalCritical',
};

function sinceLabel(since: number): string {
  const mins = Math.floor((Date.now() - since) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

export const SignalsStrip = memo(function SignalsStrip({ signals, onJump }: Props) {
  if (!signals.length) return null;
  return (
    <div className="signalsStrip" role="region" aria-label="Active signals">
      <span className="signalsStripLabel">SIGNALS</span>
      {signals.map((s) => (
        <button
          key={s.id}
          className={`signalChip ${SEVERITY_CLASS[s.severity] ?? 'signalNotice'}`}
          onClick={() => onJump(s.panel)}
          title={`Jump to panel · active ${sinceLabel(s.since ?? Date.now())}`}
          aria-label={`${s.label}, jump to panel`}
        >
          <span className="sigDot" />
          <span className="sigLabel">{s.label}</span>
          <span className="sigSince">{sinceLabel(s.since ?? Date.now())}</span>
        </button>
      ))}
    </div>
  );
});
