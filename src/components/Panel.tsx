import type { ReactNode } from 'react';
import styles from './Panel.module.css';

interface PanelProps {
  title: string;
  status?: 'live' | 'polling' | 'offline';
  children: ReactNode;
  className?: string;
}

export function Panel({ title, status, children, className = '' }: PanelProps) {
  return (
    <div className={`${styles.panel} ${className}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {status && (
          <span className={`${styles.status} ${styles[status]}`}>
            <span className={styles.dot} />
            {status}
          </span>
        )}
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
