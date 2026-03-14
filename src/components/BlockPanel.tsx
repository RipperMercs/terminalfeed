import { Panel } from './Panel';
import type { MempoolBlock } from '../hooks/useBlockStream';
import styles from './BlockPanel.module.css';

interface BlockPanelProps {
  latestBlock: MempoolBlock | null;
  mempoolSize: number | null;
  feeRate: number | null;
  connected: boolean;
}

export function BlockPanel({ latestBlock, mempoolSize, feeRate, connected }: BlockPanelProps) {
  return (
    <Panel title="Bitcoin Network" status={connected ? 'live' : 'offline'}>
      <div className={styles.grid}>
        <div className={styles.item}>
          <span className={styles.label}>Block Height</span>
          <span className={`${styles.value} ${styles.highlight}`}>
            {latestBlock ? `#${latestBlock.height.toLocaleString()}` : '--'}
          </span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>Fee Rate</span>
          <span className={styles.value}>
            {feeRate ? `${feeRate} sat/vB` : '--'}
          </span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>Mempool</span>
          <span className={styles.value}>
            {mempoolSize !== null ? formatCount(mempoolSize) + ' txs' : '--'}
          </span>
        </div>
        {latestBlock?.pool && (
          <div className={styles.item}>
            <span className={styles.label}>Last Mined By</span>
            <span className={styles.value}>{latestBlock.pool}</span>
          </div>
        )}
        {latestBlock && (
          <div className={styles.item}>
            <span className={styles.label}>Block Size</span>
            <span className={styles.value}>
              {(latestBlock.size / 1e6).toFixed(2)} MB
            </span>
          </div>
        )}
        {latestBlock && (
          <div className={styles.item}>
            <span className={styles.label}>Transactions</span>
            <span className={styles.value}>
              {latestBlock.txCount.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </Panel>
  );
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}
