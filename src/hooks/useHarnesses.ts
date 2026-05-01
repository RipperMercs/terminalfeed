import { useState, useEffect, useRef } from 'react';

export interface HarnessSummaryRow {
  harness: string;
  model: string;
  combinedScore: number;
  benchmarks: number;
}

export interface HarnessGap {
  model: string;
  best: { harness: string; score: number };
  worst: { harness: string; score: number };
  delta: number;
  benchmark: string;
}

export interface BenchmarkTop {
  id: string;
  name: string;
  unit: string;
  top: { harness: string; model: string; score: number };
}

export interface HarnessSummary {
  generatedAt: string;
  benchmarks: BenchmarkTop[];
  topCombined: HarnessSummaryRow[];
  biggestHarnessGaps: HarnessGap[];
}

const POLL_MS = 6 * 60 * 60_000;
const MOBILE_POLL_MS = 12 * 60 * 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useHarnesses() {
  const [data, setData] = useState<HarnessSummary | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/harnesses?view=summary', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current) return;
        if (json && Array.isArray(json.topCombined)) {
          setData({
            generatedAt: json.generatedAt ?? '',
            benchmarks: Array.isArray(json.benchmarks) ? json.benchmarks : [],
            topCombined: json.topCombined,
            biggestHarnessGaps: Array.isArray(json.biggestHarnessGaps) ? json.biggestHarnessGaps : [],
          });
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[Harnesses]', e); }
    };

    const poll = isMobile() ? MOBILE_POLL_MS : POLL_MS;
    fetchData();
    intervalRef.current = setInterval(fetchData, poll);

    const onVisChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchData();
        intervalRef.current = setInterval(fetchData, poll);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return data;
}
