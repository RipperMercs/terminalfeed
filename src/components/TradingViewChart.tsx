import { useEffect, useRef } from 'react';

interface Props {
  symbol?: string;
  height?: number;
}

export function TradingViewChart({ symbol = 'BITSTAMP:BTCUSD', height = 300 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || scriptLoaded.current) return;
    scriptLoaded.current = true;

    // Clear any existing content
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol,
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#080808',
      gridColor: '#1A1A22',
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: true,
      allow_symbol_change: true,
      watchlist: [
        'BITSTAMP:BTCUSD',
        'BITSTAMP:ETHUSD',
        'BINANCE:SOLUSDT',
        'BINANCE:XRPUSDT',
        'COINBASE:DOGEUSD',
      ],
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });

    container.appendChild(script);

    return () => {
      scriptLoaded.current = false;
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        width: '100%',
        height,
        overflow: 'hidden',
        borderRadius: '3px',
      }}
    />
  );
}
