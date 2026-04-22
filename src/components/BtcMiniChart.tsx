// Clean minimal SVG line chart for BTC 24h price movement
// No candlesticks, no controls, no clutter: just a smooth line

import type { PriceTick } from '../hooks/useBtcPrice';

interface Props {
  ticks: PriceTick[];
  height?: number;
}

export function BtcMiniChart({ ticks, height = 120 }: Props) {
  if (!ticks || ticks.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-dim)' }}>
        loading chart...
      </div>
    );
  }

  const prices = ticks.map(t => t.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const width = 500;
  const pad = 4;

  const points = prices.map((price, i) => {
    const x = pad + (i / (prices.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (price - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const fillPath = `${linePath} L ${width - pad},${height} L ${pad},${height} Z`;

  const isPositive = prices[prices.length - 1] >= prices[0];
  const lineColor = isPositive ? '#4ADE80' : '#F87171';

  const lastY = pad + (1 - (prices[prices.length - 1] - min) / range) * (height - pad * 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id="btcChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.12" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#btcChartGrad)" />
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width - pad} cy={lastY} r="3" fill={lineColor}>
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
