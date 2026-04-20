import { memo } from 'react';
import { PanelHead } from '../components/PanelHead';
import type { MemeToken } from '../hooks/useMemecoinRadar';
import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  tokens: MemeToken[];
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

function symbolHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const MemeRadarPanel = memo(function MemeRadarPanel({ tokens, layout, panelHealth, getGridCols }: Props) {
  if (tokens.length === 0) return null;

  // Deterministic blip positions — symbol hash keeps the same token in the same
  // spot across renders, so motion comes from the sweep arm, not position shuffle.
  const blips = tokens.slice(0, 8).map(t => {
    const h = symbolHash(t.symbol || 'x');
    const angle = (h % 360) * Math.PI / 180;
    const radius = 22 + (h % 55);
    const change = t.priceChange24h ?? 0;
    return {
      symbol: t.symbol,
      cx: 100 + radius * Math.cos(angle),
      cy: 90 + radius * Math.sin(angle) * 0.85,
      r: 2.5 + Math.min(4.5, Math.log10(Math.max(1, t.volume24h ?? 0) / 1000 + 1)),
      color: change > 0 ? 'var(--green)' : change < 0 ? 'var(--red)' : 'var(--amber)',
      delay: (h % 60) / 10,
    };
  });

  return (<>
    <PanelHead panelId="meme-radar" isStale={panelHealth.isStale('meme-radar')} layout={layout} getGridCols={getGridCols}>
      <div className="panelHeaderLeft">
        <span className="panelTitle">Memecoin Radar</span>
        <span className="panelTag">DEXSCREENER</span>
      </div>
      <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>60s</span>
    </PanelHead>
    <div className="memeRadar" aria-hidden="true">
      <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMid meet">
        <circle cx="100" cy="90" r="78" fill="none" stroke="#1f1f24" strokeWidth="1" />
        <circle cx="100" cy="90" r="52" fill="none" stroke="#1f1f24" strokeWidth="0.5" />
        <circle cx="100" cy="90" r="24" fill="none" stroke="#1f1f24" strokeWidth="0.5" />
        <line x1="20" y1="90" x2="180" y2="90" stroke="#1f1f24" strokeWidth="0.5" />
        <line x1="100" y1="12" x2="100" y2="168" stroke="#1f1f24" strokeWidth="0.5" />
        <g className="memeRadarSweep">
          <path d="M 100 90 L 178 90 A 78 78 0 0 0 169 55 Z" fill="var(--green)" opacity="0.14" />
          <line x1="100" y1="90" x2="178" y2="90" stroke="var(--green)" strokeWidth="1" opacity="0.7" />
        </g>
        {blips.map(b => (
          <circle key={b.symbol} cx={b.cx.toFixed(2)} cy={b.cy.toFixed(2)} r={b.r.toFixed(2)} fill={b.color} className="memeRadarBlip" style={{ animationDelay: `${b.delay}s`, filter: `drop-shadow(0 0 3px ${b.color})` }} />
        ))}
      </svg>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {tokens.map((t, i) => {
        const change = t.priceChange24h ?? 0;
        const isHot = change > 100;
        const badge = isHot ? 'HOT' : 'NEW';
        const badgeColor = isHot ? 'var(--red)' : 'var(--green)';
        const changeColor = change >= 0 ? 'var(--green)' : 'var(--red)';

        return (
          <a key={`${t.symbol}-${i}`} href={t.pairUrl || undefined} target="_blank" rel="noopener noreferrer"
            className="listRow" style={{ textDecoration: 'none', padding: '4px 0', borderBottom: i < tokens.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{
              fontSize: 8, padding: '1px 4px', borderRadius: 2,
              background: badgeColor, color: '#000', fontWeight: 700, marginRight: 6,
            }}>{badge}</span>
            <span style={{ flex: 1, color: 'var(--text)', fontSize: 11 }}>{t.symbol}</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 9, marginRight: 8 }}>{(t.chain || '').toUpperCase().substring(0, 5)}</span>
            <span style={{ color: changeColor, minWidth: 50, textAlign: 'right', fontSize: 10 }}>
              {change >= 0 ? '+' : ''}{change.toFixed(0)}%
            </span>
          </a>
        );
      })}
      <div style={{ marginTop: 6, fontSize: 9, color: 'var(--text-dim)', textAlign: 'center' }}>
        High risk. Not financial advice. DYOR.
      </div>
    </div>
  </>);
});
