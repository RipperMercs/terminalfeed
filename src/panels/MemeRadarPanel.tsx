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

export const MemeRadarPanel = memo(function MemeRadarPanel({ tokens, layout, panelHealth, getGridCols }: Props) {
  if (tokens.length === 0) return null;

  return (<>
    <PanelHead panelId="meme-radar" isStale={panelHealth.isStale('meme-radar')} layout={layout} getGridCols={getGridCols}>
      <div className="panelHeaderLeft">
        <span className="panelTitle">Memecoin Radar</span>
        <span className="panelTag">DEXSCREENER</span>
      </div>
      <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>60s</span>
    </PanelHead>
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
