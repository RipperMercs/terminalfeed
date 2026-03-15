// Default curated layout — what new visitors see
// To update: type "admin-save-layout" on the live site,
// paste the JSON output here, commit and deploy.

export const DEFAULT_LAYOUT = {
  panelOrder: [
    'bitcoin',
    'markets',
    'crypto',
    'news',
    'wiki-live',
    'dev-status',
    // Row 2: mix of content + data
    'reddit',
    'btc-network',
    'github',
    'crypto-global',
    'market-hours',
    'whale-watch',
    // Row 3: more feeds
    'the-wire',
    'cert-stream',
    'stackoverflow',
    'hn-community',
    'seismic',
    'gh-events',
    // Row 4: supplementary
    'disasters',
    'forex',
    'weather',
    'books',
    'solar',
    'launches',
    // Row 5: culture + lifestyle
    'podcasts',
    'wikipedia',
    'producthunt',
    'world-clocks',
    'ai-leaderboard',
    'bluesky',
    'internet-pulse',
    'uap',
    'recipe',
    'daily-learn',
    'support',
  ],
  hiddenPanels: [] as string[],
  collapsedPanels: [] as string[],
};
