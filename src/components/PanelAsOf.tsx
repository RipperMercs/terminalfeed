// Subtle per-panel freshness footer. Shows when the panel last received data
// ("as of 12s ago"), so a feed that quietly stops updating becomes visible
// instead of silently stale. Renders nothing for panels that never report data
// (editorial / static panels), which carry their own source-date line.
//
// v1 measures client-receive time (when the browser last got a response). A
// follow-up (Phase 2b) upgrades feeds to the true upstream fetch time and a
// stale-cache flag via the X-TF-As-Of / X-TF-Stale response headers.

function formatAsOf(ts: number): string {
  const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (sec < 60) return sec + 's ago';
  const min = Math.round(sec / 60);
  if (min < 60) return min + 'm ago';
  const hr = Math.round(min / 60);
  if (hr < 24) return hr + 'h ago';
  return Math.round(hr / 24) + 'd ago';
}

export function PanelAsOf({ ts, stale }: { ts: number | null; stale: boolean }) {
  if (!ts) return null;
  return (
    <div
      className="panelAsOf"
      style={{
        fontSize: 8,
        color: stale ? 'var(--amber)' : 'var(--text-dim)',
        textAlign: 'right',
        padding: '3px 4px 0',
        letterSpacing: 0.3,
        opacity: stale ? 0.9 : 0.65,
      }}
    >
      as of {formatAsOf(ts)}{stale ? ' · delayed' : ''}
    </div>
  );
}
