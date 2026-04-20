import { memo } from 'react';
import { PanelHead } from '../components/PanelHead';
import { Dial } from '../primitives';
import type { GasData } from '../hooks/useGasTracker';
import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  gas: GasData | null;
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

function gweiColor(gwei: number): string {
  if (gwei <= 10) return 'var(--green)';
  if (gwei <= 30) return 'var(--amber)';
  return 'var(--red)';
}

export const GasPanel = memo(function GasPanel({ gas, layout, panelHealth, getGridCols }: Props) {
  if (!gas) return null;

  return (<>
    <PanelHead panelId="gas" isStale={panelHealth.isStale('gas')} layout={layout} getGridCols={getGridCols}>
      <div className="panelHeaderLeft">
        <span className="panelTitle">ETH Gas</span>
        <span className="panelTag">GWEI</span>
      </div>
      <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>15s</span>
    </PanelHead>
    <div style={{ height: 130, marginBottom: 6 }}>
      <Dial
        value={gas.standard ?? 0}
        min={0}
        max={80}
        label={String(gas.standard ?? 0)}
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
        <span style={{ color: gweiColor(gas.standard), fontWeight: 600, minWidth: 60 }}>{gas.standard} gwei</span>
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
    </div>
  </>);
});
