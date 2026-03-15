// AI Hub — simulated AI agent activity feed
// Shows realistic-looking API calls from AI agents
import { useEffect, useState, useRef } from 'react';

export interface AgentCall {
  agent: string;
  endpoint: string;
  timestamp: number;
  timeAgo: string;
}

const AGENTS = [
  'claude-opus', 'claude-sonnet', 'gpt-4o', 'gpt-4o-mini', 'perplexity',
  'gemini-pro', 'gemini-flash', 'copilot', 'mistral-large', 'command-r',
  'llama-3', 'grok-2', 'deepseek-v3', 'qwen-2.5', 'cursor-ai',
];

const ENDPOINTS = [
  'briefing', 'btc-price', 'stocks', 'earthquake', 'predictions',
  'fear-greed', 'hackernews', 'dev-status', 'cyber-threats',
  'weather', 'forex', 'crypto-movers', 'disaster-alerts', 'launches',
];

function formatTimeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 3) return 'now';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m`;
}

// Stable daily counts seeded from date
function getDailyHits(): number {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  let h = seed;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h);
  return 800 + (Math.abs(h) % 600); // 800-1400
}

export function useAIHub() {
  const [calls, setCalls] = useState<AgentCall[]>([]);
  const [totalHits, setTotalHits] = useState(() => getDailyHits());
  const [agentCount] = useState(() => 8 + Math.floor(Math.random() * 6));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const addCall = () => {
      if (!mountedRef.current) return;
      const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
      const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
      setCalls(prev => [{
        agent,
        endpoint,
        timestamp: Date.now(),
        timeAgo: 'now',
      }, ...prev].slice(0, 6));
      setTotalHits(prev => prev + 1);
    };

    addCall();

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 5000 + Math.random() * 12000; // 5-17s
      timer = setTimeout(() => {
        addCall();
        schedule();
      }, delay);
    };
    schedule();

    // Update timeAgo labels
    const ageInterval = setInterval(() => {
      setCalls(prev => prev.map(c => ({ ...c, timeAgo: formatTimeAgo(c.timestamp) })));
    }, 1000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      clearInterval(ageInterval);
    };
  }, []);

  return { calls, totalHits, agentCount };
}
