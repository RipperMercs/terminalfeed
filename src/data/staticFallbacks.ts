// Static fallback data — bundled with the app
// Better than showing $0.00 or empty panels on first visit if APIs are slow
// Updated at build time or manually

export const STATIC_FALLBACKS = {
  btc_price: {
    price: 83500,
    prevPrice: 83500,
    change24h: -120,
    changePercent24h: -0.14,
    high24h: 84200,
    low24h: 82800,
    volume24h: 28000000000,
    marketCap: 1650000000000,
    lastUpdate: Date.now(),
    source: 'static',
  },
  crypto_prices: [
    { symbol: 'ETH', price: 1920, change: -1.2 },
    { symbol: 'SOL', price: 128, change: 2.1 },
    { symbol: 'XRP', price: 2.18, change: -0.8 },
    { symbol: 'DOGE', price: 0.165, change: 1.5 },
    { symbol: 'ADA', price: 0.72, change: -0.3 },
    { symbol: 'AVAX', price: 22.4, change: 1.8 },
    { symbol: 'DOT', price: 4.2, change: -1.1 },
    { symbol: 'LINK', price: 14.5, change: 0.9 },
    { symbol: 'LTC', price: 92, change: -0.5 },
    { symbol: 'HYPE', price: 15.2, change: 3.4 },
    { symbol: 'HBAR', price: 0.185, change: -0.7 },
  ],
  stocks: [
    { symbol: 'SPY', name: 'S&P 500', price: 562, change: -0.6 },
    { symbol: 'QQQ', name: 'NASDAQ', price: 480, change: -0.9 },
    { symbol: 'DIA', name: 'DOW', price: 415, change: -0.2 },
    { symbol: 'NVDA', name: 'NVIDIA', price: 118, change: -1.5 },
    { symbol: 'MSFT', name: 'Microsoft', price: 388, change: -0.4 },
    { symbol: 'AAPL', name: 'Apple', price: 228, change: -0.8 },
    { symbol: 'TSLA', name: 'Tesla', price: 252, change: 1.2 },
    { symbol: 'GOOGL', name: 'Google', price: 168, change: -0.3 },
    { symbol: 'AMD', name: 'AMD', price: 102, change: -1.8 },
    { symbol: 'COIN', name: 'Coinbase', price: 195, change: -2.1 },
    { symbol: 'PLTR', name: 'Palantir', price: 85, change: 0.6 },
  ],
  fear_greed: {
    value: 30,
    label: 'Fear',
    timestamp: Date.now(),
  },
};
