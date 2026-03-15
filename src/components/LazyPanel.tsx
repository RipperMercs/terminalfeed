import { useRef, useState, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function LazyPanel({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // once visible, always render
        }
      },
      { rootMargin: '400px' } // start loading 400px before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (
        <div style={{
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          color: 'var(--text-dim)',
          fontFamily: 'var(--mono)',
        }}>
          loading...
        </div>
      )}
    </div>
  );
}
