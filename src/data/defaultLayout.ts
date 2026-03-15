// Default curated layout — what new visitors see
// To update: type "admin-save-layout" on the live site,
// paste the JSON output here, commit and deploy.

export const DEFAULT_LAYOUT = {
  panelOrder: [
    // Row 1: top row — weather FIRST (top-left, ad slot)
    'weather',
    'bitcoin',
    'news',
    'markets',
    'wiki-live',
    'dev-status',
    // Row 2: mix of content + data
    'crypto',
    'tech-news',
    'reddit',
    'btc-network',
    'github',
    'market-hours',
    'whale-watch',
    // Row 3: more feeds
    'the-wire',
    'stackoverflow',
    'hn-community',
    'seismic',
    'gh-events',
    // Row 4: supplementary
    'disasters',
    'forex',
    'books',
    'solar',
    'launches',
    // Row 5: culture + lifestyle
    'podcasts',
    'wikipedia',
    'producthunt',
    'ai-leaderboard',
    'bluesky',
    'internet-pulse',
    'uap',
    'in-space',
    'museum-art',
    'daily-paws',
    'recipe',
    'daily-learn',
    'support',
  ],
  hiddenPanels: [] as string[],
  collapsedPanels: [] as string[],
};
