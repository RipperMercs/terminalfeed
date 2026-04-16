import { useEffect, useState, useRef } from 'react';

export interface Quote {
  text: string;
  author: string;
}

const FALLBACKS: Quote[] = [
  { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
  { text: 'Information wants to be free.', author: 'Stewart Brand' },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Code is poetry.', author: 'WordPress' },
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { text: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
  { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
];

const POLL_MS = 5 * 60_000; // 5 min

export function useFooterQuote(): Quote | null {
  const [quote, setQuote] = useState<Quote | null>(() => {
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch('https://zenquotes.io/api/random', { signal: AbortSignal.timeout(5000) });
        if (!res.ok || !mountedRef.current) return;
        const data = await res.json();
        if (data && data[0]) {
          setQuote({ text: data[0].q, author: data[0].a });
          return;
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[FooterQuote]', e); }
      // Fallback on error
      if (mountedRef.current) {
        setQuote(FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)]);
      }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return quote;
}
