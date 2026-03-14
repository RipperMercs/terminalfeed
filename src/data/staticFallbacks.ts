// Static fallback data — updated 2026-03-14
// Only used if ALL APIs fail AND no localStorage cache exists

export const STATIC_FALLBACKS = {
  btc_price: {
    price: 70470,
    prevPrice: 70470,
    change24h: -1200,
    changePercent24h: -1.67,
    high24h: 73800,
    low24h: 70100,
    volume24h: 28000000000,
    marketCap: 1390000000000,
    lastUpdate: Date.now(),
    source: 'static',
  },
  crypto_prices: [
    { symbol: 'ETH', price: 1370, change: -5.2 },
    { symbol: 'SOL', price: 117, change: -4.8 },
    { symbol: 'XRP', price: 2.08, change: -4.1 },
    { symbol: 'DOGE', price: 0.155, change: -6.3 },
    { symbol: 'ADA', price: 0.65, change: -4.9 },
    { symbol: 'AVAX', price: 17.5, change: -5.7 },
    { symbol: 'DOT', price: 3.8, change: -4.2 },
    { symbol: 'LINK', price: 12.8, change: -3.8 },
    { symbol: 'LTC', price: 82, change: -3.5 },
    { symbol: 'HYPE', price: 13.5, change: -2.1 },
    { symbol: 'HBAR', price: 0.16, change: -3.9 },
  ],
  stocks: [
    { symbol: 'SPY', name: 'S&P 500', price: 555, change: -1.2 },
    { symbol: 'QQQ', name: 'NASDAQ', price: 468, change: -1.5 },
    { symbol: 'DIA', name: 'DOW', price: 410, change: -0.8 },
    { symbol: 'NVDA', name: 'NVIDIA', price: 112, change: -2.1 },
    { symbol: 'MSFT', name: 'Microsoft', price: 380, change: -1.1 },
    { symbol: 'AAPL', name: 'Apple', price: 218, change: -1.4 },
    { symbol: 'TSLA', name: 'Tesla', price: 245, change: -2.8 },
    { symbol: 'GOOGL', name: 'Google', price: 162, change: -0.9 },
    { symbol: 'AMD', name: 'AMD', price: 98, change: -2.3 },
    { symbol: 'COIN', name: 'Coinbase', price: 185, change: -3.5 },
    { symbol: 'PLTR', name: 'Palantir', price: 80, change: -1.8 },
  ],
  fear_greed: {
    value: 16,
    label: 'Extreme Fear',
    timestamp: Date.now(),
  },
};
