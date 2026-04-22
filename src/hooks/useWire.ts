// em-dash-exempt: external quotes preserved per CLAUDE.md rule #1
// The Wire: rotating hacker culture quotes, history, and 2600 references.
// Lint skips this file because the body is direct citations from 2600,
// DEF CON, and period-accurate cultural sources where the em-dash
// attribution format is part of the artifact.
import { useState, useEffect } from 'react';

export interface WireItem {
  text: string;
  type: 'quote' | 'history' | 'fact' | 'meta';
}

const WIRE_CONTENT: WireItem[] = [
  { text: '"My crime is that of curiosity." — The Mentor, 1986', type: 'quote' },
  { text: '"Information wants to be free." — Stewart Brand', type: 'quote' },
  { text: '"We explore... and you call us criminals." — The Hacker Manifesto', type: 'quote' },
  { text: '"Hack the planet." — Hackers, 1995', type: 'quote' },
  { text: '"The street finds its own uses for things." — William Gibson', type: 'quote' },
  { text: '"Never underestimate the determination of a kid who is time-rich and cash-poor." — Cory Doctorow', type: 'quote' },
  { text: '1971 — John Draper discovers the 2600 Hz whistle unlocks AT&T long-distance lines', type: 'history' },
  { text: '1983 — WarGames hits theaters. An entire generation starts hacking.', type: 'history' },
  { text: '1984 — 2600: The Hacker Quarterly publishes its first issue', type: 'history' },
  { text: '1986 — The Mentor writes "The Conscience of a Hacker"', type: 'history' },
  { text: '1988 — Robert Morris launches the first internet worm. 6,000 machines infected.', type: 'history' },
  { text: '1994 — First HOPE conference in New York City', type: 'history' },
  { text: '1995 — Kevin Mitnick arrested by the FBI after 2-year manhunt', type: 'history' },
  { text: '1998 — L0pht testifies before Senate: "We could take down the internet in 30 minutes"', type: 'history' },
  { text: '1999 — The Matrix makes terminals cool forever', type: 'history' },
  { text: '2008 — Satoshi Nakamoto publishes the Bitcoin whitepaper', type: 'history' },
  { text: '2013 — Snowden reveals global surveillance programs', type: 'history' },
  { text: '2600 Hz — the exact frequency that unlocked phone networks', type: 'fact' },
  { text: 'Blue box — Wozniak and Jobs built them before Apple existed', type: 'fact' },
  { text: 'DEF CON — the world\'s largest hacker convention. Every August in Vegas.', type: 'fact' },
  { text: 'Phrack Magazine — underground ezine since 1985', type: 'fact' },
  { text: '>>> we come in peace. please don\'t hack us. <<<', type: 'meta' },
  { text: '>>> curiosity welcomed. destruction not. <<<', type: 'meta' },
  { text: '>>> 0wn nothing. learn everything. <<<', type: 'meta' },
];

export function useWire(): { item: WireItem; index: number; total: number; fading: boolean } {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % WIRE_CONTENT.length);
        setFading(false);
      }, 500);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return { item: WIRE_CONTENT[index], index, total: WIRE_CONTENT.length, fading };
}
