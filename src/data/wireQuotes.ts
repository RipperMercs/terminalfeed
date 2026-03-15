// 2600 / hacker culture quotes — rotate in the footer strip
// A nod to the culture that built this kind of thing

export const WIRE_QUOTES = [
  '"Information wants to be free." — Stewart Brand',
  '"Curiosity is not a crime."',
  '"We explore... and you call us criminals." — The Mentor, 1986',
  '"Hack the planet." — Hackers, 1995',
  '2600 Hz — the frequency that started it all',
  '"My crime is that of curiosity." — The Hacker Manifesto',
  '2600 Magazine — published quarterly since 1984',
  '"The Matrix" made terminals cool forever — 1999',
  '"Another one got caught today..." — The Mentor',
  'HOPE (Hackers On Planet Earth) — since 1994',
  '"The only truly secure system is one that is powered off." — Gene Spafford',
  'Phone phreaking: exploring telephone systems before the internet existed',
  '"Never trust a computer you can\'t throw out a window." — Steve Wozniak',
  '>>> we come in peace. please don\'t hack us. <<<',
  '>>> 0wn nothing. learn everything. <<<',
  '"There is no patch for human stupidity."',
  '1971: Cap\'n Crunch discovers the 2600 Hz whistle',
  '1988: Robert Morris launches the first internet worm',
  '1995: Kevin Mitnick arrested by the FBI',
  '2013: Snowden reveals global surveillance programs',
  '"The best way to predict the future is to invent it." — Alan Kay',
  '>>> curiosity welcomed. destruction not. <<<',
];

export function getRandomWireQuote(): string {
  return WIRE_QUOTES[Math.floor(Math.random() * WIRE_QUOTES.length)];
}
