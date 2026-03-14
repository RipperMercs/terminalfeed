import { Panel } from './Panel';
import type { FearGreedData } from '../hooks/useFearGreed';
import styles from './FearGreedPanel.module.css';

interface Props {
  data: FearGreedData | null;
}

export function FearGreedPanel({ data }: Props) {
  if (!data) {
    return (
      <Panel title="Fear & Greed" status="polling">
        <div className={styles.loading}>loading...</div>
      </Panel>
    );
  }

  const color = getColor(data.value);
  const barWidth = `${data.value}%`;

  return (
    <Panel title="Fear & Greed" status="polling">
      <div className={styles.container}>
        <div className={styles.valueRow}>
          <span className={styles.value} style={{ color }}>{data.value}</span>
          <span className={styles.label} style={{ color }}>{data.label}</span>
        </div>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            style={{ width: barWidth, background: color }}
          />
        </div>
        <div className={styles.scale}>
          <span>Extreme Fear</span>
          <span>Extreme Greed</span>
        </div>
      </div>
    </Panel>
  );
}

function getColor(value: number): string {
  if (value <= 25) return 'var(--red)';
  if (value <= 45) return 'var(--amber)';
  if (value <= 55) return 'var(--gold)';
  if (value <= 75) return 'var(--green)';
  return 'var(--cyan)';
}
