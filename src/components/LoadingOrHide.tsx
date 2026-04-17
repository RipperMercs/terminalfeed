import { useEffect, useState } from 'react';

interface LoadingOrHideProps {
  timeoutMs?: number;
  label?: string;
  style?: React.CSSProperties;
}

export function LoadingOrHide({
  timeoutMs = 8000,
  label = 'loading...',
  style,
}: LoadingOrHideProps) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), timeoutMs);
    return () => clearTimeout(t);
  }, [timeoutMs]);
  if (hidden) return null;
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 16,
        fontSize: 10,
        color: 'var(--text-dim)',
        ...style,
      }}
    >
      {label}
    </div>
  );
}
