import { useState, useEffect, useRef } from 'react';

export interface SecFiling {
  formType: string;
  company: string;
  cik: string;
  accession: string | null;
  url: string;
  filedAt: string;
}

const POLL_MS = 90_000;
const MOBILE_POLL_MS = 180_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useSecFilings() {
  const [data, setData] = useState<SecFiling[] | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/sec-filings', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        const arr = Array.isArray(json?.data) ? json.data : [];
        if (!mountedRef.current) return;
        setData(arr.slice(0, 20).map((row: Record<string, unknown>) => ({
          formType: typeof row.form_type === 'string' ? row.form_type : '8-K',
          company: typeof row.company === 'string' ? row.company : '',
          cik: typeof row.cik === 'string' ? row.cik : '',
          accession: typeof row.accession === 'string' ? row.accession : null,
          url: typeof row.url === 'string' ? row.url : '',
          filedAt: typeof row.filed_at === 'string' ? row.filed_at : '',
        })));
      } catch (e) { if (import.meta.env.DEV) console.warn('[SecFilings]', e); }
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
