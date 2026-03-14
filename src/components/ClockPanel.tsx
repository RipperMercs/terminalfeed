import { Panel } from './Panel';
import { useTime } from '../hooks/useTime';
import styles from './ClockPanel.module.css';

export function ClockPanel() {
  const now = useTime();

  const timeStr = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Market hours
  const nyH = getOffset(now, 'America/New_York');
  const londonH = getOffset(now, 'Europe/London');
  const tokyoH = getOffset(now, 'Asia/Tokyo');

  return (
    <Panel title="System Clock">
      <div className={styles.container}>
        <div className={styles.time}>{timeStr}</div>
        <div className={styles.date}>{dateStr}</div>
        <div className={styles.utc}>
          UTC {now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
        </div>

        <div className={styles.markets}>
          <MarketRow label="NYSE" hour={nyH} open={9.5} close={16} />
          <MarketRow label="LSE" hour={londonH} open={8} close={16.5} />
          <MarketRow label="TSE" hour={tokyoH} open={9} close={15} />
          <MarketRow label="BTC" hour={0} open={0} close={24} alwaysOn />
        </div>
      </div>
    </Panel>
  );
}

function MarketRow({
  label,
  hour,
  open,
  close,
  alwaysOn,
}: {
  label: string;
  hour: number;
  open: number;
  close: number;
  alwaysOn?: boolean;
}) {
  const isOpen = alwaysOn || (hour >= open && hour < close);
  return (
    <div className={styles.marketRow}>
      <span className={styles.marketLabel}>{label}</span>
      <span className={`${styles.marketStatus} ${isOpen ? styles.open : styles.closed}`}>
        {isOpen ? 'OPEN' : 'CLOSED'}
      </span>
    </div>
  );
}

function getOffset(date: Date, tz: string): number {
  const str = date.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false });
  const [h, m] = str.split(':').map(Number);
  return h + m / 60;
}
