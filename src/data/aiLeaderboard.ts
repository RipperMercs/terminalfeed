// AI Model Leaderboard, curated, updated manually
// Based on the Arena (formerly LMSYS Chatbot Arena) TEXT leaderboard
// Last updated: 2026-08-02
// Source: arena.ai/leaderboard, Text Arena overall column, August 1 2026 vote
// cutoff. Single source by design: earlier revisions of this file blended
// several aggregators that disagree on absolute ELO, so the numbers moved for
// reasons that had nothing to do with the models. Every score below is copied
// from that one board, and the ordering is that board's ordering.
// Live source is worker-additions/worker.js AI_LEADERBOARD (served at
// /api/ai-leaderboard with a catalog-driven freshness flag); this file is the
// bundled fallback the panel renders until that fetch resolves. Keep in sync.
//
// Read this as a tier, not a ranking. The top ten sit inside a 23 point band
// and the published confidence intervals (plus or minus 4 to 9 points) overlap
// across almost every adjacent pair, so anything below the first entry is
// within statistical noise.
//
// Why Claude Opus 5 sits mid table despite being the newest flagship: this is
// the TEXT arena, which scores blind human preference on open ended chat. It is
// not an agentic or coding measure. Opus 5 (released 2026-07-24) leads on the
// benchmarks it was built for, and Anthropic's own headline figures are about
// agentic and long horizon work, but on chat preference it currently lands
// between Opus 4.7 and Muse Spark. Both published variants are listed because
// the board rates them separately. See src/data/harnesses.ts for the
// agentic-coding view, where Opus 5 is covered against its own basis.
//
// Changes this cycle: Claude Opus 5 (High) and (Max) enter, replacing the
// GPT-5.6 and Gemini 3.2 Pro entries carried by the previous snapshot, neither
// of which holds a top ten text rating on this board (GPT-5.6 Sol sits at 13).
// Claude Opus 4.8 also drops out at 14 with no published score in this cutoff,
// and Meta's Muse Spark pair enters. OpenAI has no top ten text entry in this
// snapshot; that is the source's result, not an omission.
export const aiLeaderboard = [
  { rank: 1, name: 'Claude Fable 5', company: 'Anthropic', elo: 1509 },
  { rank: 2, name: 'Claude Opus 4.6 Thinking', company: 'Anthropic', elo: 1505 },
  { rank: 3, name: 'Claude Opus 4.7 Thinking', company: 'Anthropic', elo: 1502 },
  { rank: 4, name: 'Claude Opus 4.6', company: 'Anthropic', elo: 1497 },
  { rank: 5, name: 'Claude Opus 4.7', company: 'Anthropic', elo: 1492 },
  { rank: 6, name: 'Claude Opus 5 (High)', company: 'Anthropic', elo: 1492 },
  { rank: 7, name: 'Claude Opus 5 (Max)', company: 'Anthropic', elo: 1490 },
  { rank: 8, name: 'Muse Spark 1.1', company: 'Meta', elo: 1490 },
  { rank: 9, name: 'Muse Spark', company: 'Meta', elo: 1488 },
  { rank: 10, name: 'Gemini 3 Pro', company: 'Google', elo: 1486 },
];
