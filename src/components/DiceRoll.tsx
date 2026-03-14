import { useState, useRef } from 'react';

type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' | 'coin';

const DIE_MAX: Record<DieType, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100, coin: 2,
};

export function DiceRoll() {
  const [die, setDie] = useState<DieType>('d20');
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const roll = () => {
    if (rolling) return;
    setRolling(true);

    let count = 0;
    intervalRef.current = setInterval(() => {
      count++;
      setResult(Math.floor(Math.random() * DIE_MAX[die]) + 1);
      if (count >= 8) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const final = Math.floor(Math.random() * DIE_MAX[die]) + 1;
        setResult(final);
        setRolling(false);
        const label = die === 'coin'
          ? (final === 1 ? 'Heads' : 'Tails')
          : `${die}: ${final}`;
        setHistory(prev => [label, ...prev].slice(0, 10));
      }
    }, 60);
  };

  const isCrit = die === 'd20' && result === 20;
  const isFail = die === 'd20' && result === 1;
  const resultColor = isCrit ? 'var(--gold)' : isFail ? 'var(--red)' : 'var(--text)';
  const display = die === 'coin' && result
    ? (result === 1 ? 'HEADS' : 'TAILS')
    : result;

  return (
    <div className="diceContent">
      <div
        className={`diceResult ${rolling ? 'diceRolling' : ''} ${isCrit ? 'diceCrit' : ''} ${isFail ? 'diceFail' : ''}`}
        style={{ color: resultColor }}
      >
        {display ?? '?'}
      </div>
      <button className="diceRollBtn" onClick={roll} disabled={rolling}>
        Roll {die}
      </button>
      <div className="dicePicker">
        {(Object.keys(DIE_MAX) as DieType[]).map(d => (
          <button
            key={d}
            className={`dicePickBtn ${die === d ? 'dicePickActive' : ''}`}
            onClick={() => setDie(d)}
          >
            {d}
          </button>
        ))}
      </div>
      {history.length > 0 && (
        <div className="diceHistory">
          {history.join(' · ')}
        </div>
      )}
    </div>
  );
}
