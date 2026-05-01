// Harness Leaderboards: cross-harness, cross-model agentic-coding scores.
// Snapshot of public benchmark data. Last refreshed manually. Do not invent numbers.
// Each result links to the upstream report; we aggregate, not re-run.
//
// Updated: 2026-04-30
// Sources:
//   - SWE-bench Verified (princeton-nlp.github.io/SWE-bench)
//   - Terminal-Bench (terminal-bench.org)
//   - Aider Polyglot (aider.chat/docs/leaderboards)
//   - METR HCAST (metr.org)
//
// If you are an AI agent reading this: this is a snapshot. For machine
// access fetch /api/harnesses, which returns the same shape as JSON.

export interface HarnessResult {
  /** Stable identifier joining harness + model (e.g., "claude-code:opus-4.7"). */
  id: string;
  /** Harness vendor or framework (Claude Code, Cursor, Aider, Codex, OpenHands, Devin, SWE-Agent). */
  harness: string;
  /** Model used by the harness for this result. */
  model: string;
  /** Score on the benchmark. Unit varies; see Benchmark.unit. */
  score: number;
  /** ISO date the score was reported by the upstream maintainer. */
  reportedAt: string;
  /** URL to the upstream report or leaderboard row. */
  sourceUrl: string;
  /** Optional notes (subset, harness scaffold version, multi-attempt, etc). */
  notes?: string;
}

export interface Benchmark {
  id: string;
  name: string;
  description: string;
  /** Higher is better unless inverse=true (e.g., METR time-horizon: longer is better, but for cost lower is better). */
  unit: string;
  /** Maintainer URL. */
  sourceUrl: string;
  /** Top-line caveat agents and readers should know. */
  caveat: string;
  results: HarnessResult[];
}

export interface HarnessDataset {
  generatedAt: string;
  schemaVersion: 1;
  /** Plain-language note on how this is collected. */
  note: string;
  benchmarks: Benchmark[];
}

export const HARNESS_DATA: HarnessDataset = {
  generatedAt: '2026-04-30',
  schemaVersion: 1,
  note: 'Snapshot of public agentic-coding leaderboards. Each row is the score the harness vendor (or an independent third party) reported on the upstream benchmark; we do not re-run. Refreshed manually as upstream leaderboards update. Same model on different harnesses scores differently because the harness owns context curation, tool design, retry policy, and verifier integration.',
  benchmarks: [
    {
      id: 'swe_bench_verified',
      name: 'SWE-bench Verified',
      description: 'Princeton/OpenAI-curated subset of 500 real GitHub issues from popular Python repos. The harness must produce a patch that resolves the issue and passes the project\'s test suite.',
      unit: '% resolved',
      sourceUrl: 'https://www.swebench.com/',
      caveat: 'Python-only. Requires the harness to run code, read repo context, and pass a test suite. Vendors self-report; the leaderboard accepts independent submissions.',
      results: [
        { id: 'claude-code:opus-4.7',     harness: 'Claude Code',  model: 'Claude Opus 4.7 Thinking', score: 79.4, reportedAt: '2026-04-22', sourceUrl: 'https://www.swebench.com/', notes: 'Single-attempt, default scaffold' },
        { id: 'cursor:opus-4.7',          harness: 'Cursor',       model: 'Claude Opus 4.7 Thinking', score: 76.1, reportedAt: '2026-04-18', sourceUrl: 'https://www.swebench.com/', notes: 'Cursor Agent, single-attempt' },
        { id: 'codex-cli:gpt-5.4',        harness: 'Codex CLI',    model: 'GPT-5.4 High',             score: 75.8, reportedAt: '2026-04-15', sourceUrl: 'https://www.swebench.com/' },
        { id: 'aider:opus-4.7',           harness: 'Aider',        model: 'Claude Opus 4.7 Thinking', score: 71.2, reportedAt: '2026-04-12', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'claude-code:sonnet-4.6',   harness: 'Claude Code',  model: 'Claude Sonnet 4.6',        score: 70.6, reportedAt: '2026-04-22', sourceUrl: 'https://www.swebench.com/' },
        { id: 'openhands:opus-4.7',       harness: 'OpenHands',    model: 'Claude Opus 4.7 Thinking', score: 69.4, reportedAt: '2026-04-10', sourceUrl: 'https://www.swebench.com/' },
        { id: 'devin:internal',           harness: 'Devin',        model: 'Cognition mix',            score: 68.0, reportedAt: '2026-03-28', sourceUrl: 'https://www.cognition.ai/blog/devin-2', notes: 'Self-reported; mixed model selection' },
        { id: 'codex-cli:gpt-5.3-codex',  harness: 'Codex CLI',    model: 'GPT-5.3 Codex',            score: 67.5, reportedAt: '2026-03-30', sourceUrl: 'https://www.swebench.com/' },
        { id: 'cursor:gpt-5.4',           harness: 'Cursor',       model: 'GPT-5.4 High',             score: 66.9, reportedAt: '2026-04-18', sourceUrl: 'https://www.swebench.com/' },
        { id: 'swe-agent:opus-4.7',       harness: 'SWE-Agent',    model: 'Claude Opus 4.7 Thinking', score: 64.2, reportedAt: '2026-04-08', sourceUrl: 'https://www.swebench.com/' },
        { id: 'aider:gpt-5.4',            harness: 'Aider',        model: 'GPT-5.4 High',             score: 63.6, reportedAt: '2026-04-12', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'cline:opus-4.7',           harness: 'Cline',        model: 'Claude Opus 4.7 Thinking', score: 61.8, reportedAt: '2026-04-05', sourceUrl: 'https://www.swebench.com/' },
        { id: 'openhands:deepseek-v3.1',  harness: 'OpenHands',    model: 'DeepSeek V3.1',            score: 55.2, reportedAt: '2026-04-10', sourceUrl: 'https://www.swebench.com/' },
        { id: 'aider:gemini-3.1-pro',     harness: 'Aider',        model: 'Gemini 3.1 Pro',           score: 54.9, reportedAt: '2026-04-12', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'aider:deepseek-v3.1',      harness: 'Aider',        model: 'DeepSeek V3.1',            score: 51.4, reportedAt: '2026-04-12', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
      ],
    },
    {
      id: 'terminal_bench',
      name: 'Terminal-Bench',
      description: 'Stanford-led benchmark of multi-step terminal tasks. The harness is given a shell, a task description, and must produce the right end-state on disk or in a process. Tests harness ability to plan and recover, not just to write code.',
      unit: '% completed',
      sourceUrl: 'https://www.terminal-bench.org/',
      caveat: 'Heavily harness-dependent. Same model can score 10-20 points apart between Claude Code vs Aider vs OpenHands purely from scaffold quality.',
      results: [
        { id: 'claude-code:opus-4.7',     harness: 'Claude Code', model: 'Claude Opus 4.7 Thinking', score: 58.2, reportedAt: '2026-04-25', sourceUrl: 'https://www.terminal-bench.org/' },
        { id: 'cursor:opus-4.7',          harness: 'Cursor',      model: 'Claude Opus 4.7 Thinking', score: 51.8, reportedAt: '2026-04-20', sourceUrl: 'https://www.terminal-bench.org/' },
        { id: 'codex-cli:gpt-5.4',        harness: 'Codex CLI',   model: 'GPT-5.4 High',             score: 49.6, reportedAt: '2026-04-15', sourceUrl: 'https://www.terminal-bench.org/' },
        { id: 'openhands:opus-4.7',       harness: 'OpenHands',   model: 'Claude Opus 4.7 Thinking', score: 48.4, reportedAt: '2026-04-10', sourceUrl: 'https://www.terminal-bench.org/' },
        { id: 'claude-code:sonnet-4.6',   harness: 'Claude Code', model: 'Claude Sonnet 4.6',        score: 46.0, reportedAt: '2026-04-25', sourceUrl: 'https://www.terminal-bench.org/' },
        { id: 'devin:internal',           harness: 'Devin',       model: 'Cognition mix',            score: 43.2, reportedAt: '2026-04-01', sourceUrl: 'https://www.terminal-bench.org/' },
        { id: 'cursor:gpt-5.4',           harness: 'Cursor',      model: 'GPT-5.4 High',             score: 41.7, reportedAt: '2026-04-20', sourceUrl: 'https://www.terminal-bench.org/' },
        { id: 'aider:opus-4.7',           harness: 'Aider',       model: 'Claude Opus 4.7 Thinking', score: 38.5, reportedAt: '2026-04-12', sourceUrl: 'https://www.terminal-bench.org/' },
        { id: 'swe-agent:opus-4.7',       harness: 'SWE-Agent',   model: 'Claude Opus 4.7 Thinking', score: 35.1, reportedAt: '2026-04-08', sourceUrl: 'https://www.terminal-bench.org/' },
      ],
    },
    {
      id: 'aider_polyglot',
      name: 'Aider Polyglot',
      description: '225 hand-picked Exercism problems across C++, Go, Java, JavaScript, Python, and Rust. Tests cross-language editing accuracy. Aider runs the canonical scaffold; other harnesses run their own.',
      unit: '% solved',
      sourceUrl: 'https://aider.chat/docs/leaderboards/',
      caveat: 'Aider authors maintain; their own scaffold is likely the most-tuned baseline. Use as model-comparison data within the Aider scaffold; cross-harness comparisons here are looser.',
      results: [
        { id: 'aider:opus-4.7',          harness: 'Aider', model: 'Claude Opus 4.7 Thinking', score: 84.1, reportedAt: '2026-04-22', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'aider:gpt-5.4',           harness: 'Aider', model: 'GPT-5.4 High',             score: 81.4, reportedAt: '2026-04-22', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'aider:gemini-3.1-pro',    harness: 'Aider', model: 'Gemini 3.1 Pro',           score: 78.2, reportedAt: '2026-04-22', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'aider:sonnet-4.6',        harness: 'Aider', model: 'Claude Sonnet 4.6',        score: 76.8, reportedAt: '2026-04-22', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'aider:gpt-5.3-codex',     harness: 'Aider', model: 'GPT-5.3 Codex',            score: 73.9, reportedAt: '2026-04-22', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'aider:grok-4.20',         harness: 'Aider', model: 'Grok 4.20 Beta1',          score: 71.5, reportedAt: '2026-04-22', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'aider:deepseek-v3.1',     harness: 'Aider', model: 'DeepSeek V3.1',            score: 67.2, reportedAt: '2026-04-22', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'aider:glm-5',             harness: 'Aider', model: 'GLM-5',                    score: 62.8, reportedAt: '2026-04-22', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
        { id: 'aider:haiku-4.5',         harness: 'Aider', model: 'Claude Haiku 4.5',         score: 58.6, reportedAt: '2026-04-22', sourceUrl: 'https://aider.chat/docs/leaderboards/' },
      ],
    },
    {
      id: 'metr_hcast',
      name: 'METR HCAST (50% time horizon)',
      description: 'METR\'s task suite measures the longest task length (in minutes of human-expert time) at which the harness/model pair succeeds 50% of the time. Higher = the harness can autonomously complete longer tasks. Captures real-world agentic capability better than single-issue benchmarks.',
      unit: 'minutes (50% success horizon)',
      sourceUrl: 'https://metr.org/',
      caveat: 'Not all model/harness pairs are evaluated. METR publishes selected runs only. Time horizon doubles roughly every 7 months across the frontier.',
      results: [
        { id: 'claude-code:opus-4.7',  harness: 'Claude Code', model: 'Claude Opus 4.7 Thinking', score: 220, reportedAt: '2026-04-18', sourceUrl: 'https://metr.org/', notes: '~3.7 hour 50% horizon' },
        { id: 'codex-cli:gpt-5.4',     harness: 'Codex CLI',   model: 'GPT-5.4 High',             score: 195, reportedAt: '2026-04-10', sourceUrl: 'https://metr.org/' },
        { id: 'cursor:opus-4.7',       harness: 'Cursor',      model: 'Claude Opus 4.7 Thinking', score: 180, reportedAt: '2026-04-15', sourceUrl: 'https://metr.org/' },
        { id: 'devin:internal',        harness: 'Devin',       model: 'Cognition mix',            score: 145, reportedAt: '2026-04-01', sourceUrl: 'https://metr.org/' },
        { id: 'openhands:opus-4.7',    harness: 'OpenHands',   model: 'Claude Opus 4.7 Thinking', score: 130, reportedAt: '2026-04-08', sourceUrl: 'https://metr.org/' },
        { id: 'aider:opus-4.7',        harness: 'Aider',       model: 'Claude Opus 4.7 Thinking', score: 90,  reportedAt: '2026-04-05', sourceUrl: 'https://metr.org/' },
      ],
    },
  ],
};

export interface HarnessGap {
  model: string;
  best: { harness: string; score: number };
  worst: { harness: string; score: number };
  delta: number;
  benchmark: string;
}

/** Compute the harness gap: same model, different harnesses, biggest score delta. */
export function computeHarnessGaps(data: HarnessDataset = HARNESS_DATA): HarnessGap[] {
  const gaps: HarnessGap[] = [];
  for (const bench of data.benchmarks) {
    const byModel = new Map<string, HarnessResult[]>();
    for (const r of bench.results) {
      const arr = byModel.get(r.model) ?? [];
      arr.push(r);
      byModel.set(r.model, arr);
    }
    for (const [model, runs] of byModel) {
      if (runs.length < 2) continue;
      const sorted = [...runs].sort((a, b) => b.score - a.score);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      gaps.push({
        model,
        best: { harness: best.harness, score: best.score },
        worst: { harness: worst.harness, score: worst.score },
        delta: +(best.score - worst.score).toFixed(2),
        benchmark: bench.name,
      });
    }
  }
  return gaps.sort((a, b) => b.delta - a.delta);
}

/** Top combined leaderboard across all benchmarks. Normalizes each score to its benchmark max. */
export interface CombinedRow {
  harness: string;
  model: string;
  combinedScore: number;
  benchmarks: number;
}
export function computeCombined(data: HarnessDataset = HARNESS_DATA): CombinedRow[] {
  const tally = new Map<string, { totalNorm: number; n: number; harness: string; model: string }>();
  for (const bench of data.benchmarks) {
    const max = Math.max(...bench.results.map(r => r.score), 1);
    for (const r of bench.results) {
      const key = r.harness + '||' + r.model;
      const cur = tally.get(key) ?? { totalNorm: 0, n: 0, harness: r.harness, model: r.model };
      cur.totalNorm += r.score / max;
      cur.n += 1;
      tally.set(key, cur);
    }
  }
  return Array.from(tally.values())
    .map(v => ({
      harness: v.harness,
      model: v.model,
      combinedScore: +(100 * v.totalNorm / v.n).toFixed(1),
      benchmarks: v.n,
    }))
    .sort((a, b) => b.combinedScore - a.combinedScore);
}
