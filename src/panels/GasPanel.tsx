import { memo } from 'react';
import { PanelHead } from '../components/PanelHead';
import { Dial } from '../primitives';
import type { GasData, GasTrend } from '../hooks/useGasTracker';
import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  gas: GasData | null;
  trend: GasTrend;
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

function gweiColor(gwei: number): string {
  if (gwei <= 10) return 'var(--green)';
  if (gwei <= 30) return 'var(--amber)';
  return 'var(--red)';
}

// Rough 2026 L2 gas estimates relative to mainnet standard. Static: L2 fees
// drift slowly and are dominated by the L1 blob fee rather than per-tx.
function estimateL2Gwei(mainnetStandard: number) {
  return {
    arbitrum: Math.max(0.1, +(mainnetStandard * 0.02).toFixed(2)),
    base: Math.max(0.05, +(mainnetStandard * 0.01).toFixed(2)),
    optimism: Math.max(0.05, +(mainnetStandard * 0.01).toFixed(2)),
    polygon: Math.max(20, Math.round(mainnetStandard * 3)),
  };
}

function trendGlyph(trend: GasTrend): { glyph: string; color: string; title: string } | null {
  if (trend === 'up')   return { glyph: '▲', color: 'var(--red)',    title: 'Rising over the last 5 min' };
  if (trend === 'down') return { glyph: '▼', color: 'var(--green)',  title: 'Falling over the last 5 min' };
  if (trend === 'flat') return { glyph: '▬', color: 'var(--text-dim)', title: 'Flat over the last 5 min' };
  return null;
}

export const GasPanel = memo(function GasPanel({ gas, trend, layout, panelHealth, getGridCols }: Props) {
  if (!gas) return null;

  const standard = gas.standard ?? 0;
  const tg = trendGlyph(trend);
  const l2 = estimateL2Gwei(standard);

  return (<>
    <PanelHead panelId="gas" isStale={panelHealth.isStale('gas')} layout={layout} getGridCols={getGridCols}>
      <div className="panelHeaderLeft">
        <span className="panelTitle">ETH Gas</span>
        <span className="panelTag">GWEI</span>
        {tg && <span title={tg.title} style={{ fontSize: 10, color: tg.color, marginLeft: 4 }}>{tg.glyph}</span>}
      </div>
      <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>15s</span>
    </PanelHead>
    <div style={{ height: 130, marginBottom: 6 }}>
      <Dial
        value={standard}
        min={0}
        max={80}
        label={String(standard)}
        unit="gwei"
        ariaLabel="Ethereum gas price in gwei"
      />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="listRow">
        <span style={{ fontSize: 9, color: 'var(--text-dim)', minWidth: 60 }}>SLOW</span>
        <span style={{ color: gweiColor(gas.low), fontWeight: 600, minWidth: 60 }}>{gas.low} gwei</span>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>~5 min</span>
      </div>
      <div className="listRow">
        <span style={{ fontSize: 9, color: 'var(--text-dim)', minWidth: 60 }}>STANDARD</span>
        <span style={{ color: gweiColor(standard), fontWeight: 600, minWidth: 60 }}>{standard} gwei</span>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>~1 min</span>
      </div>
      <div className="listRow">
        <span style={{ fontSize: 9, color: 'var(--text-dim)', minWidth: 60 }}>FAST</span>
        <span style={{ color: gweiColor(gas.fast), fontWeight: 600, minWidth: 60 }}>{gas.fast} gwei</span>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>~15 sec</span>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2, fontSize: 10, color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Base Fee: {gas.baseFee?.toFixed(1)} gwei</span>
        {gas.lastBlock > 0 && <span>Block: {gas.lastBlock.toLocaleString()}</span>}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2, fontSize: 9, color: 'var(--text-dim)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ letterSpacing: 1, textTransform: 'uppercase' }}>L2 estimated</span>
          <span style={{ fontStyle: 'italic' }}>gwei</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, fontFamily: 'var(--font-mono, monospace)' }}>
          <span>Arbitrum: <span style={{ color: 'var(--text)' }}>{l2.arbitrum}</span></span>
          <span>Base: <span style={{ color: 'var(--text)' }}>{l2.base}</span></span>
          <span>Optimism: <span style={{ color: 'var(--text)' }}>{l2.optimism}</span></span>
          <span>Polygon: <span style={{ color: 'var(--text)' }}>{l2.polygon}</span></span>
        </div>
      </div>
    </div>
  </>);
});
