// Static mock data for the visual lab.
// We use frozen snapshots so the lab loads instantly and panel chrome
// is what changes between renders, not the underlying numbers.

export type Category =
  | 'btc'
  | 'crypto'
  | 'news'
  | 'security'
  | 'ai'
  | 'dev'
  | 'geo'
  | 'weather'
  | 'markets'
  | 'space'
  | 'prediction';

export const CATEGORY_COLOR: Record<Category, string> = {
  btc:        '#F9CB42', // gold
  crypto:     '#EF9F27', // amber
  news:       '#4FD1C5', // cyan
  security:   '#F87171', // red
  ai:         '#A78BFA', // purple
  dev:        '#4ADE80', // green
  geo:        '#60A5FA', // blue
  weather:    '#5DCAA5', // teal
  markets:    '#4ADE80', // green
  space:      '#A78BFA', // purple
  prediction: '#EF9F27', // amber
};

export const CATEGORY_LABEL: Record<Category, string> = {
  btc:        'BTC',
  crypto:     'CRYPTO',
  news:       'NEWS',
  security:   'SEC',
  ai:         'AI',
  dev:        'DEV',
  geo:        'GEO',
  weather:    'WX',
  markets:    'MKT',
  space:      'SPC',
  prediction: 'PRED',
};

// BTC sparkline (60 points, mocked but plausible for a recent intraday move)
export const btcTicker = {
  price: 67432.18,
  change24hPct: 2.41,
  changeAbs: 1583.42,
  high24h: 68104,
  low24h: 65821,
  volume24h: 41_200_000_000,
  marketCap: 1_330_000_000_000,
  spark: [
    65821, 65905, 66012, 66180, 66340, 66520, 66410, 66280, 66155, 66050,
    65990, 66120, 66305, 66490, 66720, 66880, 67020, 66980, 66850, 66720,
    66610, 66540, 66490, 66610, 66780, 66950, 67110, 67280, 67420, 67550,
    67680, 67810, 67920, 68040, 68104, 68020, 67910, 67780, 67620, 67510,
    67430, 67380, 67340, 67310, 67290, 67320, 67380, 67450, 67520, 67580,
    67610, 67580, 67540, 67490, 67450, 67430, 67420, 67425, 67430, 67432,
  ],
};

export const cryptoMovers = [
  { sym: 'SOL',   name: 'Solana',     price: 178.42, change: 8.21 },
  { sym: 'ETH',   name: 'Ethereum',   price: 3421.05, change: 4.12 },
  { sym: 'AVAX',  name: 'Avalanche',  price: 41.88,  change: 3.05 },
  { sym: 'LINK',  name: 'Chainlink',  price: 18.92,  change: 2.40 },
  { sym: 'ADA',   name: 'Cardano',    price: 0.612,  change: -1.82 },
  { sym: 'DOT',   name: 'Polkadot',   price: 7.41,   change: -2.15 },
  { sym: 'XRP',   name: 'XRP',        price: 0.5821, change: -3.04 },
];

export const newsItems = [
  { source: 'HN',     title: 'Show HN: I built a real-time terminal dashboard with 30+ live feeds', age: '2h' },
  { source: 'HN',     title: 'Why we are moving off Postgres after 8 years',                          age: '4h' },
  { source: 'TechC.', title: 'Anthropic releases Claude Opus 4.7 with 1M token context',              age: '6h' },
  { source: 'Verge',  title: 'Bitcoin breaks $68k as ETF inflows hit weekly record',                  age: '7h' },
  { source: 'HN',     title: 'Ask HN: What programming books are you reading in 2026?',               age: '9h' },
];

export const securityAlerts = [
  { sev: 'HIGH', cve: 'CVE-2026-1247', title: 'Remote code execution in OpenSSL 3.5.x',     age: '1h' },
  { sev: 'MED',  cve: 'CVE-2026-1208', title: 'Auth bypass in Keycloak admin console',       age: '5h' },
  { sev: 'HIGH', cve: 'CVE-2026-1191', title: 'Sandbox escape in Node 22 worker_threads',    age: '8h' },
  { sev: 'LOW',  cve: 'CVE-2026-1184', title: 'XSS in markdown-it ≤ 14.0.0 link parser',     age: '11h' },
];

export const aiActivity = [
  { agent: 'claude-opus-4-7',   action: 'fetched /api/briefing',  ms: 142 },
  { agent: 'gpt-5o',            action: 'fetched /api/btc-price', ms: 88  },
  { agent: 'gemini-2.5-flash',  action: 'fetched /api/stocks',    ms: 211 },
  { agent: 'perplexity-bot',    action: 'fetched /api/predictions', ms: 173 },
  { agent: 'claude-haiku-4-5',  action: 'fetched /api/hackernews',  ms: 64 },
];

export const devEvents = [
  { repo: 'vercel/next.js',        event: 'release',  detail: 'v15.4.0',                    age: '1h' },
  { repo: 'anthropics/claude-cookbook', event: 'push',     detail: '+ tool-use streaming examples', age: '3h' },
  { repo: 'oven-sh/bun',           event: 'release',  detail: 'v1.2.10',                    age: '4h' },
  { repo: 'rust-lang/rust',        event: 'pr',       detail: '#138422 const generics',     age: '6h' },
];

export const earthquakes = [
  { mag: 5.4, place: '32km E of Calama, Chile',         age: '14m', depth: 112 },
  { mag: 4.8, place: 'Banda Sea, Indonesia',             age: '52m', depth: 188 },
  { mag: 4.2, place: '8km NNE of Volcano, Hawaii',       age: '1h',  depth: 4   },
  { mag: 3.6, place: '27km W of Petrolia, CA',           age: '2h',  depth: 18  },
];

export const weather = {
  city: 'Los Angeles, CA',
  temp: 72,
  feels: 70,
  desc: 'partly cloudy',
  high: 78,
  low: 61,
  wind: 8,
  humidity: 54,
  uv: 6,
  forecast: [
    { d: 'TUE', hi: 78, lo: 61, icon: 'sun-cloud' },
    { d: 'WED', hi: 81, lo: 63, icon: 'sun' },
    { d: 'THU', hi: 79, lo: 64, icon: 'sun' },
    { d: 'FRI', hi: 74, lo: 60, icon: 'cloud' },
    { d: 'SAT', hi: 71, lo: 58, icon: 'rain' },
  ],
};

export const stocks = [
  { sym: 'NVDA', price: 1284.50, change: 3.21 },
  { sym: 'AAPL', price: 232.18,  change: 0.84 },
  { sym: 'MSFT', price: 478.92,  change: 1.12 },
  { sym: 'GOOG', price: 198.45,  change: -0.42 },
  { sym: 'TSLA', price: 384.21,  change: -1.85 },
  { sym: 'META', price: 612.30,  change: 2.04 },
];

export const launches = [
  { vehicle: 'Falcon 9',   payload: 'Starlink 8-12',          when: 'in 4h 12m', site: 'Vandenberg SLC-4E' },
  { vehicle: 'Atlas V',    payload: 'USSF-87',                when: 'in 18h',     site: 'Cape Canaveral SLC-41' },
  { vehicle: 'Long March', payload: 'Yaogan-39 Group 04',     when: 'in 1d 6h',   site: 'Xichang' },
];

export const predictions = [
  { question: 'Will BTC close above $70k in May?', yes: 64, vol: '$2.1M' },
  { question: 'Will Fed cut rates in June?',         yes: 38, vol: '$840k' },
  { question: 'Will GTA VI launch in 2026?',         yes: 71, vol: '$612k' },
  { question: 'Will OpenAI IPO before 2027?',         yes: 22, vol: '$418k' },
];
