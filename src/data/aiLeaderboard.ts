// AI Model Leaderboard, curated, updated manually
// Based on Chatbot Arena / LMSYS ELO ratings
// Last updated: 2026-06-01
// Live source is worker-additions/worker.js AI_LEADERBOARD (served at
// /api/ai-leaderboard with a catalog-driven freshness flag); this file is the
// bundled fallback the panel renders until that fetch resolves. Keep in sync.
// Note: cross-source aggregators disagree on absolute Chatbot Arena ELO (scales
// ranged ~1418 to ~1551 in the late-May snapshots), so the figures below keep
// this file's internal scale. The consistent signal across sources is that
// Claude Opus 4.8 (shipped 2026-05-28) overtook GPT-5.5 for the top spot on the
// Artificial Analysis intelligence index in late May; reflected here.
export const aiLeaderboard = [
  { rank: 1, name: 'Claude Opus 4.8 Thinking', company: 'Anthropic', elo: 1552 },
  { rank: 2, name: 'GPT-5.5 Pro', company: 'OpenAI', elo: 1549 },
  { rank: 3, name: 'Gemini 3.1 Pro', company: 'Google', elo: 1532 },
  { rank: 4, name: 'Claude Opus 4.8', company: 'Anthropic', elo: 1524 },
  { rank: 5, name: 'GPT-5.5 High', company: 'OpenAI', elo: 1516 },
  { rank: 6, name: 'Claude Mythos Preview', company: 'Anthropic', elo: 1511 },
  { rank: 7, name: 'Grok 4', company: 'xAI', elo: 1501 },
  { rank: 8, name: 'DeepSeek V4 Pro', company: 'DeepSeek', elo: 1492 },
  { rank: 9, name: 'Gemini 3.0 Pro', company: 'Google', elo: 1488 },
  { rank: 10, name: 'Kimi K2.5', company: 'Moonshot', elo: 1485 },
];
