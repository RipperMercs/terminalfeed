// Static fallback data -- updated 2026-04-14
// Only used if ALL APIs fail AND no localStorage cache exists
// Keep these roughly current so stale fallbacks don't mislead users

export const STATIC_FALLBACKS = {
  btc_price: {
    price: 75475,
    prevPrice: 74442,
    change24h: 1033,
    changePercent24h: 1.39,
    high24h: 76200,
    low24h: 73800,
    volume24h: 62500000000,
    marketCap: 1495000000000,
    lastUpdate: Date.now(),
    source: 'static',
  },
  crypto_prices: [
    { symbol: 'ETH', price: 1620, change: 3.1 },
    { symbol: 'SOL', price: 134, change: 4.2 },
    { symbol: 'XRP', price: 2.18, change: 1.8 },
    { symbol: 'DOGE', price: 0.168, change: 2.5 },
    { symbol: 'ADA', price: 0.72, change: 3.4 },
    { symbol: 'AVAX', price: 21.5, change: 4.1 },
    { symbol: 'DOT', price: 4.35, change: 2.8 },
    { symbol: 'LINK', price: 14.2, change: 3.0 },
    { symbol: 'LTC', price: 88, change: 2.2 },
    { symbol: 'HYPE', price: 15.8, change: 5.3 },
    { symbol: 'HBAR', price: 0.19, change: 4.7 },
  ],
  stocks: [
    { symbol: 'SPY', name: 'S&P 500', price: 535, change: 0.8 },
    { symbol: 'QQQ', name: 'NASDAQ', price: 452, change: 1.1 },
    { symbol: 'DIA', name: 'DOW', price: 398, change: 0.5 },
    { symbol: 'NVDA', name: 'NVIDIA', price: 105, change: 1.8 },
    { symbol: 'MSFT', name: 'Microsoft', price: 375, change: 0.6 },
    { symbol: 'AAPL', name: 'Apple', price: 210, change: 0.9 },
    { symbol: 'TSLA', name: 'Tesla', price: 252, change: 2.1 },
    { symbol: 'GOOGL', name: 'Google', price: 158, change: 0.7 },
    { symbol: 'AMD', name: 'AMD', price: 95, change: 1.5 },
    { symbol: 'COIN', name: 'Coinbase', price: 198, change: 3.2 },
    { symbol: 'PLTR', name: 'Palantir', price: 85, change: 1.4 },
  ],
  fear_greed: {
    value: 32,
    label: 'Fear',
    timestamp: Date.now(),
  },
};
