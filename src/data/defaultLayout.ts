// Default curated layout — what new visitors see
// Most visually active/moving panels near the top to wow first-time visitors

export const DEFAULT_LAYOUT = {
  panelOrder: [
    // Row 1: anchor panels (weather, btc, news, markets already pinned in render)
    'weather',
    'bitcoin',
    'news',
    'markets',
    'wiki-live',
    'dev-status',
    // Row 2: visually active + high value
    'crypto',
    'ai-hub',
    'whale-watch',
    'btc-network',
    'tech-news',
    'reddit',
    // Row 3: more moving feeds
    'github',
    'gh-events',
    'the-wire',
    'predictions',
    'market-hours',
    'seismic',
    // Row 4: content feeds
    'stackoverflow',
    'hn-community',
    'forex',
    'disasters',
    'steam',
    'bluesky',
    // Row 5: supplementary
    'solar',
    'launches',
    'ai-leaderboard',
    'npm-trends',
    'wikipedia',
    'producthunt',
    'internet-pulse',
    'books',
    // Bottom: lifestyle + fun
    'daily-learn',
    'daily-paws',
    'museum-art',
    'recipe',
    'uap',
    'fitness',
    'support',
  ],
  hiddenPanels: [] as string[],
  collapsedPanels: [] as string[],
};
