// AI Model Leaderboard, curated, updated manually
// Based on Chatbot Arena / LMSYS ELO ratings
// Last updated: 2026-06-01
// Live source is worker-additions/worker.js AI_LEADERBOARD (served at
// /api/ai-leaderboard with a catalog-driven freshness flag); this file is the
// bundled fallback the panel renders until that fetch resolves. Keep in sync.
// Note: Claude Opus 4.8 shipped 2026-05-28. Name carried forward from 4.7; ELO/rank
// are provisional until a fresh Chatbot Arena rating publishes for 4.8.
export const aiLeaderboard = [
  { rank: 1, name: 'GPT-5.5 Pro', company: 'OpenAI', elo: 1551 },
  { rank: 2, name: 'Claude Opus 4.8 Thinking', company: 'Anthropic', elo: 1545 },
  { rank: 3, name: 'Gemini 3.1 Pro', company: 'Google', elo: 1530 },
  { rank: 4, name: 'GPT-5.5 High', company: 'OpenAI', elo: 1515 },
  { rank: 5, name: 'Claude Mythos Preview', company: 'Anthropic', elo: 1510 },
  { rank: 6, name: 'Grok 4', company: 'xAI', elo: 1500 },
  { rank: 7, name: 'Claude Sonnet 4', company: 'Anthropic', elo: 1495 },
  { rank: 8, name: 'DeepSeek V4 Pro', company: 'DeepSeek', elo: 1490 },
  { rank: 9, name: 'Gemini 3.0 Pro', company: 'Google', elo: 1488 },
  { rank: 10, name: 'Kimi K2.5', company: 'Moonshot', elo: 1485 },
];
