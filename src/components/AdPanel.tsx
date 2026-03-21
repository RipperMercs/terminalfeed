import { useEffect, useRef } from 'react';

// ── AdSense Configuration ──
// Once approved, set your publisher ID and ad slot IDs here
const ADSENSE_PUB_ID = 'ca-pub-7224757913262984';
const AD_SLOTS: Record<string, string> = {
  'ad-1': '', // e.g. '1234567890'
  'ad-2': '',
  'ad-3': '',
};

interface AdPanelProps {
  slotId: 'ad-1' | 'ad-2' | 'ad-3';
}

export function AdPanel({ slotId }: AdPanelProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  const isActive = ADSENSE_PUB_ID && AD_SLOTS[slotId];

  useEffect(() => {
    if (!isActive || pushed.current) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet
    }
  }, [isActive]);

  // ── Active AdSense mode ──
  if (isActive) {
    return (
      <div ref={adRef} style={{ minHeight: 100, overflow: 'hidden' }}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_PUB_ID}
          data-ad-slot={AD_SLOTS[slotId]}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // ── Placeholder mode (pre-approval) ──
  return (
    <div style={{
      minHeight: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px dashed var(--border, #2a2a28)',
      borderRadius: 3,
      padding: '12px 8px',
      opacity: 0.4,
    }}>
      <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>
        ad space — pending approval
      </span>
    </div>
  );
}
