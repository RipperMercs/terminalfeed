// AI Model Leaderboard, curated, updated manually
// Based on Chatbot Arena / LMSYS ELO ratings
// Last updated: 2026-06-08
// Live source is worker-additions/worker.js AI_LEADERBOARD (served at
// /api/ai-leaderboard with a catalog-driven freshness flag); this file is the
// bundled fallback the panel renders until that fetch resolves. Keep in sync.
// Note: cross-source aggregators disagree on absolute Chatbot Arena ELO (the
// openlm.ai arena mirror clustered the frontier cohort around 1490 to 1506 in
// the early-June snapshot), so the figures below keep this file's internal
// scale. Ordering tracks the openlm.ai arena snapshot with Claude Opus 4.8
// (shipped 2026-05-28) held at the top, consistent with its lead on the
// Artificial Analysis intelligence index.
export const aiLeaderboard = [
  { rank: 1, name: 'Claude Opus 4.8 Thinking', company: 'Anthropic', elo: 1552 },
  { rank: 2, name: 'GPT-5.5 High', company: 'OpenAI', elo: 1549 },
  { rank: 3, name: 'Claude Opus 4.8', company: 'Anthropic', elo: 1537 },
  { rank: 4, name: 'Gemini 3.1 Pro', company: 'Google', elo: 1532 },
  { rank: 5, name: 'Gemini 3.5 Flash', company: 'Google', elo: 1528 },
  { rank: 6, name: 'Claude Opus 4.7 Thinking', company: 'Anthropic', elo: 1522 },
  { rank: 7, name: 'Grok 4.20', company: 'xAI', elo: 1514 },
  { rank: 8, name: 'GPT-5.4 High', company: 'OpenAI', elo: 1508 },
  { rank: 9, name: 'Gemini 3 Pro', company: 'Google', elo: 1501 },
  { rank: 10, name: 'DeepSeek V4 Pro', company: 'DeepSeek', elo: 1495 },
];
