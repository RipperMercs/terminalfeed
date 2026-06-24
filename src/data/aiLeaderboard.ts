// AI Model Leaderboard, curated, updated manually
// Based on Chatbot Arena / LMSYS ELO ratings
// Last updated: 2026-06-22
// Live source is worker-additions/worker.js AI_LEADERBOARD (served at
// /api/ai-leaderboard with a catalog-driven freshness flag); this file is the
// bundled fallback the panel renders until that fetch resolves. Keep in sync.
// Note: cross-source aggregators disagree on absolute Chatbot Arena ELO (the
// mid-June snapshot showed the top cohort clustered within roughly 55 ELO
// points, the tightest spread on record), so the figures below keep this file's
// internal scale rather than any single aggregator's absolute numbers. Ordering
// keeps Claude Fable 5 (released 2026-06) at the top on overall intelligence,
// with GPT-5.6 Pro, Gemini 3.2 Pro, and Claude Mythos 5 leading the frontier
// per the latest Arena snapshot. DeepSeek V4.1 Pro enters as the highest
// open-weight model, within striking distance of the top closed entries.
export const aiLeaderboard = [
  { rank: 1, name: 'Claude Fable 5', company: 'Anthropic', elo: 1565 },
  { rank: 2, name: 'GPT-5.6 Pro', company: 'OpenAI', elo: 1561 },
  { rank: 3, name: 'Claude Opus 4.8 Thinking', company: 'Anthropic', elo: 1558 },
  { rank: 4, name: 'Gemini 3.2 Pro', company: 'Google', elo: 1552 },
  { rank: 5, name: 'Claude Mythos 5', company: 'Anthropic', elo: 1547 },
  { rank: 6, name: 'Claude Opus 4.8', company: 'Anthropic', elo: 1543 },
  { rank: 7, name: 'GPT-5.5 High', company: 'OpenAI', elo: 1536 },
  { rank: 8, name: 'Gemini 3.1 Pro', company: 'Google', elo: 1528 },
  { rank: 9, name: 'Grok 4.3', company: 'xAI', elo: 1521 },
  { rank: 10, name: 'DeepSeek V4.1 Pro', company: 'DeepSeek', elo: 1514 },
];
