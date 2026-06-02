import { useState, useEffect } from 'react';

export interface BreakingAlert {
  id: string | null;
  headline: string;
  severity: 'info' | 'warning' | 'critical';
  href?: string;
  created_at: string | null;
  expires_at: string;
}

const POLL_MS = 90000;
const DISMISS_KEY = 'tf_breaking_dismissed';

// Polls the operator-raised breaking-alert banner. The server is the sole expiry
// authority (it only returns an alert that is well-formed and unexpired), so the
// client trusts the payload verbatim and never computes liveness itself. On a
// fetch failure the last-known-good alert is kept rather than cleared. Dismissal
// is per-id via sessionStorage, so dismissing one alert does not suppress the next.
export function useBreaking(): { alert: BreakingAlert | null; dismiss: (id: string) => void } {
  const [alert, setAlert] = useState<BreakingAlert | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let active = true;
    let lastGood: BreakingAlert | null = null;

    const poll = async () => {
      try {
        const res = await fetch('/api/breaking', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { alert?: BreakingAlert | null };
        if (!active) return;
        const next = data && data.alert ? data.alert : null;
        lastGood = next;
        setAlert(next);
      } catch {
        if (active && lastGood) setAlert(lastGood);
      }
    };

    poll();
    const id = window.setInterval(poll, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const dismiss = (id: string) => {
    try {
      sessionStorage.setItem(DISMISS_KEY, id);
    } catch {
      // sessionStorage unavailable (private mode); dismissal is best-effort.
    }
    setDismissedId(id);
  };

  const visible = alert && alert.id && alert.id === dismissedId ? null : alert;
  return { alert: visible, dismiss };
}
