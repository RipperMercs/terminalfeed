// AI Model Leaderboard, curated, updated manually
// Based on Chatbot Arena / LMSYS ELO ratings
// Last updated: 2026-06-17
// Live source is worker-additions/worker.js AI_LEADERBOARD (served at
// /api/ai-leaderboard with a catalog-driven freshness flag); this file is the
// bundled fallback the panel renders until that fetch resolves. Keep in sync.
// Note: cross-source aggregators disagree on absolute Chatbot Arena ELO (the
// mid-June snapshot showed the frontier cohort clustered within roughly 55 ELO
// points, the tightest spread on record), so the figures below keep this file's
// internal scale rather than any single aggregator's absolute numbers. Ordering
// debuts Claude Fable 5 (released 2026-06) at the top: it leads TensorFeed's
// intelligence index (TFII 87.4, ahead of Claude Opus 4.8 at 86.6), with the
// newest mid-June frontier entries (GPT-5.6, Gemini 3.2 Pro, Claude Mythos 5)
// folded into the roster below it.
export const aiLeaderboard = [
  { rank: 1, name: 'Claude Fable 5', company: 'Anthropic', elo: 1564 },
  { rank: 2, name: 'Claude Opus 4.8 Thinking', company: 'Anthropic', elo: 1561 },
  { rank: 3, name: 'GPT-5.6 Pro', company: 'OpenAI', elo: 1556 },
  { rank: 4, name: 'Claude Opus 4.8', company: 'Anthropic', elo: 1548 },
  { rank: 5, name: 'Gemini 3.2 Pro', company: 'Google', elo: 1544 },
  { rank: 6, name: 'GPT-5.5 High', company: 'OpenAI', elo: 1539 },
  { rank: 7, name: 'Claude Mythos 5', company: 'Anthropic', elo: 1533 },
  { rank: 8, name: 'Gemini 3.1 Pro', company: 'Google', elo: 1528 },
  { rank: 9, name: 'Grok 4.3', company: 'xAI', elo: 1519 },
  { rank: 10, name: 'GPT-5.5', company: 'OpenAI', elo: 1512 },
];
