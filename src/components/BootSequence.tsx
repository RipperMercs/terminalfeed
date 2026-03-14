import { useState, useEffect, useCallback } from 'react';
import './BootSequence.css';

const LINES = [
  { text: '> initializing terminalfeed.io...', delay: 0 },
  { text: '> connecting to live feeds.............. [OK]', delay: 200 },
  { text: '> loading market data................... [OK]', delay: 400 },
  { text: '> syncing crypto prices................. [OK]', delay: 600 },
  { text: '> establishing news feeds............... [OK]', delay: 800 },
  { text: '> rendering command center.............. [OK]', delay: 1000 },
  { text: '> SYSTEM ONLINE — all feeds operational', delay: 1300 },
  { text: '> welcome to the terminal.', delay: 1500 },
];

const BOOT_KEY = 'tf_last_boot';
const BOOT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

interface BootSequenceProps {
  onComplete: () => void;
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  const finish = useCallback(() => {
    setFadingOut(true);
    localStorage.setItem(BOOT_KEY, Date.now().toString());
    setTimeout(onComplete, 500);
  }, [onComplete]);

  // Skip on click or keypress
  useEffect(() => {
    const skip = () => finish();
    window.addEventListener('click', skip);
    window.addEventListener('keydown', skip);
    return () => {
      window.removeEventListener('click', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [finish]);

  // Reveal lines on schedule
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < LINES.length; i++) {
      timers.push(setTimeout(() => setVisibleLines(i + 1), LINES[i].delay));
    }
    // Auto-finish right after last line
    timers.push(setTimeout(finish, 2000));
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  return (
    <div className={`bootOverlay ${fadingOut ? 'bootFadeOut' : ''}`}>
      <div className="bootContent">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`bootLine ${line.text.includes('[OK]') ? 'bootOk' : ''} ${line.text.includes('SYSTEM ONLINE') ? 'bootOnline' : ''} ${line.text.includes('welcome') ? 'bootWelcome' : ''}`}
          >
            {line.text}
          </div>
        ))}
        <span className="bootCursor">_</span>
      </div>
    </div>
  );
}

export function shouldShowBoot(): boolean {
  try {
    const last = localStorage.getItem(BOOT_KEY);
    if (!last) return true;
    return Date.now() - parseInt(last, 10) > BOOT_COOLDOWN;
  } catch {
    return false;
  }
}
