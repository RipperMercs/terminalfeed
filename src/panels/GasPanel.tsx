import { memo } from 'react';
import { PanelHead } from '../components/PanelHead';
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

  // Clamp the dial to 0-80 gwei so extreme spikes don't peg the needle offscreen
  const dialGwei = Math.max(0, Math.min(80, gas.standard ?? 0));
  const needleAngle = -90 + (dialGwei / 80) * 180;
  const arcEndX = 20 + (dialGwei / 80) * 160;
  const arcEndY = 100 - Math.sin((dialGwei / 80) * Math.PI) * 80;

  return (<>
    <PanelHead panelId="gas" isStale={panelHealth.isStale('gas')} layout={layout} getGridCols={getGridCols}>
      <div className="panelHeaderLeft">
        <span className="panelTitle">ETH Gas</span>
        <span className="panelTag">GWEI</span>
      </div>
      <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>15s</span>
    </PanelHead>
    <div className="gasDial" style={{ ['--gas-angle' as string]: `${needleAngle}deg` }}>
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="gasArcGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--green)" />
            <stop offset="50%" stopColor="var(--amber)" />
            <stop offset="100%" stopColor="var(--red)" />
          </linearGradient>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gasArcGrad)" strokeWidth="6" opacity="0.25" />
        <path d={`M 20 100 A 80 80 0 0 1 ${arcEndX.toFixed(2)} ${arcEndY.toFixed(2)}`} fill="none" stroke="url(#gasArcGrad)" strokeWidth="6" strokeLinecap="round" />
        <line className="gasNeedle" x1="100" y1="100" x2="100" y2="35" stroke="var(--text)" strokeWidth="2" />
        <circle cx="100" cy="100" r="4" fill="var(--text)" />
      </svg>
      <div className="gasDialValue">{gas.standard}<span className="gasDialUnit">gwei</span></div>
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
