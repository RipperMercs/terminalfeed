import { memo, useMemo } from 'react';
import { useClaudeStatus } from '../hooks/useClaudeStatus';
import { useCloudStatus } from '../hooks/useCloudStatus';
import { useDevStatus } from '../hooks/useDevStatus';
import { PanelHead } from './PanelHead';
import type { LayoutManager } from '../hooks/useLayoutManager';
import styles from './StatusWall.module.css';

interface Props {
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

type WallState = 'ok' | 'degr' | 'down' | 'unk';

interface Cell {
  key: string;
  name: string;
  state: WallState;
  description?: string;
}

function normalizeDevIndicator(indicator: string): WallState {
  if (indicator === 'none') return 'ok';
  if (indicator === 'minor') return 'degr';
  if (indicator === 'major' || indicator === 'critical') return 'down';
  return 'unk';
}

function normalizeClaudeComponent(status: string): WallState {
  if (status === 'operational') return 'ok';
  if (status === 'degraded_performance' || status === 'under_maintenance') return 'degr';
  if (status === 'partial_outage' || status === 'major_outage') return 'down';
  return 'unk';
}

function normalizeCloudStatus(status: string): WallState {
  if (status === 'operational') return 'ok';
  if (status === 'incident') return 'down';
  return 'unk';
}

const STATE_LABEL: Record<WallState, string> = {
  ok: 'OK',
  degr: 'DEGR',
  down: 'DOWN',
  unk: '?',
};

const STATE_CLASS: Record<WallState, string> = {
  ok: styles.ok,
  degr: styles.degr,
  down: styles.down,
  unk: styles.unk,
};

export const StatusWall = memo(function StatusWall({ layout, panelHealth, getGridCols }: Props) {
  const devStatus = useDevStatus();
  const claudeStatus = useClaudeStatus();
  const cloudStatus = useCloudStatus();

  const cells = useMemo<Cell[]>(() => {
    const out: Cell[] = [];

    // Claude components (brand-first)
    if (claudeStatus?.components) {
      for (const c of claudeStatus.components) {
        out.push({
          key: 'claude:' + c.id,
          name: c.name,
          state: normalizeClaudeComponent(c.status),
        });
      }
    }

    // Dev/Ops services (13)
    for (const s of devStatus) {
      out.push({
        key: 'dev:' + s.name,
        name: s.name,
        state: normalizeDevIndicator(s.indicator),
        description: s.description,
      });
    }

    // Cloud providers (3)
    if (cloudStatus?.providers) {
      for (const p of cloudStatus.providers) {
        out.push({
          key: 'cloud:' + p.name,
          name: p.name,
          state: normalizeCloudStatus(p.status),
        });
      }
    }

    return out;
  }, [devStatus, claudeStatus, cloudStatus]);

  const counts = useMemo(() => {
    const c = { ok: 0, degr: 0, down: 0, unk: 0 };
    for (const cell of cells) c[cell.state]++;
    return c;
  }, [cells]);

  const worstState: WallState =
    counts.down > 0 ? 'down' : counts.degr > 0 ? 'degr' : counts.ok > 0 ? 'ok' : 'unk';

  const lampColor =
    worstState === 'down' ? 'var(--red)'
    : worstState === 'degr' ? 'var(--amber)'
    : worstState === 'ok' ? 'var(--green)'
    : 'var(--text-dim)';

  const isStale = panelHealth.isStale('status-wall');

  return (
    <>
      <PanelHead panelId="status-wall" isStale={isStale} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Status</span>
          <span className="panelTag">GLOBAL</span>
        </div>
        <div className="panelLive">
          <span className="liveDot" style={{ background: lampColor }} />
          <span className="liveText">{cells.length || 0} SERVICES</span>
        </div>
      </PanelHead>

      {cells.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>
          loading status...
        </div>
      ) : (
        <>
          <div className={styles.wall}>
            {cells.map(cell => (
              <div
                key={cell.key}
                className={`${styles.cell} ${STATE_CLASS[cell.state]}`}
                title={cell.description || cell.name}
              >
                <div className={styles.row}>
                  <span className={styles.name}>{cell.name}</span>
                  <span className={styles.lamp} />
                </div>
                <span className={styles.badge}>{STATE_LABEL[cell.state]}</span>
              </div>
            ))}
          </div>
          <div className={styles.summary}>
            <span className={styles.sumOk}>OK <b>{counts.ok}</b></span>
            <span className={styles.sumDegr}>DEGRADED <b>{counts.degr}</b></span>
            <span className={styles.sumDown}>INCIDENTS <b>{counts.down}</b></span>
            {counts.unk > 0 && (
              <span className={styles.sumUnk}>UNKNOWN <b>{counts.unk}</b></span>
            )}
          </div>
        </>
      )}
    </>
  );
});
