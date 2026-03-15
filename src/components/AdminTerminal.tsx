import { useState, useRef, useEffect, useCallback } from 'react';
import type { LayoutManager } from '../hooks/useLayoutManager';
import './AdminTerminal.css';

interface Props {
  layout: LayoutManager;
  onClose: () => void;
}

interface HistoryEntry {
  type: 'input' | 'output' | 'error' | 'success' | 'warn';
  text: string;
}

// SHA-256 hash of the password — never store plaintext in source
// To change the password, hash the new one and replace this value
const PW_HASH = '9c610d1dde3014a68d87fd034477405c2aa1851298731f70fe2baf611c921ffb';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30_000;

const COMMANDS: Record<string, string> = {
  help: 'List available commands',
  'save-layout': 'Export current layout as default (copies to clipboard)',
  'reset-layout': 'Reset layout to defaults',
  panels: 'List all panels and their status',
  'hide <panel>': 'Hide a panel by ID',
  'show <panel>': 'Show a hidden panel by ID',
  'collapse-all': 'Collapse all visible panels',
  'expand-all': 'Expand all panels',
  organize: 'Toggle organize mode',
  fullscreen: 'Toggle fullscreen',
  uptime: 'Show session uptime',
  clear: 'Clear terminal output',
  exit: 'Close this terminal',
  version: 'Show TerminalFeed version',
  theme: 'Show current theme info',
  stats: 'Show panel statistics',
  motd: 'Show message of the day',
};

const MOTD = [
  'Stay curious. Stay informed.',
  'The terminal sees all.',
  'Information wants to be free.',
  'Trust the feed.',
  'All systems nominal.',
  'Welcome back, operator.',
  'The grid never sleeps.',
  'Data flows like water.',
];

const DENY_MESSAGES = [
  'ACCESS DENIED — Credentials do not match.',
  'AUTHENTICATION FAILURE — Nice try.',
  'REJECTED — This incident will be reported.',
];

const startTime = Date.now();

export function AdminTerminal({ layout, onClose }: Props) {
  const [authed, setAuthed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show login prompt on mount
  useEffect(() => {
    setHistory([
      { type: 'output', text: '╔════════════════════════════════════════════════╗' },
      { type: 'output', text: '║  TERMINALFEED ADMIN CONSOLE v1.0.0 — RIPPERX  ║' },
      { type: 'output', text: '╚════════════════════════════════════════════════╝' },
      { type: 'output', text: '' },
      { type: 'warn', text: '⚠ RESTRICTED SYSTEM — AUTHORIZED ACCESS ONLY' },
      { type: 'output', text: '' },
      { type: 'output', text: 'Enter access code:' },
    ]);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [authed]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const push = useCallback((entries: HistoryEntry[]) => {
    setHistory(prev => [...prev, ...entries]);
  }, []);

  const handleLogin = useCallback(async (pw: string) => {
    const now = Date.now();
    if (now < lockedUntil) {
      const secsLeft = Math.ceil((lockedUntil - now) / 1000);
      push([
        { type: 'input', text: '> ••••••••' },
        { type: 'error', text: `LOCKED OUT — Try again in ${secsLeft}s.` },
      ]);
      return;
    }

    push([{ type: 'input', text: '> ••••••••' }]);

    const hash = await sha256(pw);
    if (hash === PW_HASH) {
      setAuthed(true);
      setAttempts(0);
      push([
        { type: 'success', text: 'ACCESS GRANTED' },
        { type: 'output', text: '' },
        { type: 'success', text: MOTD[Math.floor(Math.random() * MOTD.length)] },
        { type: 'output', text: 'Type "help" for available commands.' },
        { type: 'output', text: '' },
      ]);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const deny = DENY_MESSAGES[Math.min(newAttempts - 1, DENY_MESSAGES.length - 1)];

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        push([
          { type: 'error', text: deny },
          { type: 'error', text: '' },
          { type: 'error', text: `Too many failed attempts. Locked for ${LOCKOUT_MS / 1000}s.` },
          { type: 'error', text: 'Connection logged. Trace initiated.' },
        ]);
        // Auto-close after lockout message
        setTimeout(() => onClose(), 2500);
      } else {
        push([
          { type: 'error', text: deny },
          { type: 'output', text: `Attempts remaining: ${MAX_ATTEMPTS - newAttempts}` },
          { type: 'output', text: '' },
          { type: 'output', text: 'Enter access code:' },
        ]);
      }
    }
  }, [attempts, lockedUntil, push, onClose]);

  const exec = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setCmdHistory(prev => [...prev, trimmed]);
    setCmdHistoryIdx(-1);
    push([{ type: 'input', text: `> ${trimmed}` }]);

    const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);
    const arg = args.join(' ');

    switch (cmd) {
      case 'help': {
        const lines: HistoryEntry[] = [
          { type: 'output', text: '── Available Commands ──' },
        ];
        for (const [name, desc] of Object.entries(COMMANDS)) {
          lines.push({ type: 'output', text: `  ${name.padEnd(18)} ${desc}` });
        }
        push(lines);
        break;
      }

      case 'save-layout': {
        const exportData = {
          panelOrder: layout.panelOrder,
          hiddenPanels: Array.from(layout.hiddenPanels),
          collapsedPanels: Array.from(layout.collapsedPanels),
        };
        const json = JSON.stringify(exportData, null, 2);
        navigator.clipboard.writeText(json).catch(() => {});
        console.log('DEFAULT LAYOUT:', json);
        push([
          { type: 'success', text: 'Layout exported to clipboard & console.' },
          { type: 'output', text: `  panels: ${layout.panelOrder.length}` },
          { type: 'output', text: `  hidden: ${layout.hiddenPanels.size}` },
          { type: 'output', text: `  collapsed: ${layout.collapsedPanels.size}` },
        ]);
        break;
      }

      case 'reset-layout': {
        layout.resetLayout();
        push([{ type: 'success', text: 'Layout reset to defaults.' }]);
        break;
      }

      case 'panels': {
        const lines: HistoryEntry[] = [
          { type: 'output', text: '── Panel Status ──' },
        ];
        for (const id of layout.panelOrder) {
          const hidden = layout.hiddenPanels.has(id);
          const collapsed = layout.collapsedPanels.has(id);
          const status = hidden ? '  [HIDDEN]' : collapsed ? '  [COLLAPSED]' : '  [ACTIVE]';
          const color: HistoryEntry['type'] = hidden ? 'error' : collapsed ? 'output' : 'success';
          lines.push({ type: color, text: `  ${id.padEnd(24)} ${status}` });
        }
        push(lines);
        break;
      }

      case 'hide': {
        if (!arg) {
          push([{ type: 'error', text: 'Usage: hide <panel-id>' }]);
        } else {
          const match = layout.panelOrder.find(p => p.toLowerCase() === arg);
          if (match) {
            if (!layout.hiddenPanels.has(match)) {
              layout.toggleHidden(match);
              push([{ type: 'success', text: `Panel "${match}" hidden.` }]);
            } else {
              push([{ type: 'output', text: `Panel "${match}" is already hidden.` }]);
            }
          } else {
            push([{ type: 'error', text: `Unknown panel: "${arg}"` }]);
          }
        }
        break;
      }

      case 'show': {
        if (!arg) {
          push([{ type: 'error', text: 'Usage: show <panel-id>' }]);
        } else {
          const match = layout.panelOrder.find(p => p.toLowerCase() === arg);
          if (match) {
            if (layout.hiddenPanels.has(match)) {
              layout.toggleHidden(match);
              push([{ type: 'success', text: `Panel "${match}" is now visible.` }]);
            } else {
              push([{ type: 'output', text: `Panel "${match}" is already visible.` }]);
            }
          } else {
            push([{ type: 'error', text: `Unknown panel: "${arg}"` }]);
          }
        }
        break;
      }

      case 'collapse-all': {
        for (const id of layout.panelOrder) {
          if (!layout.hiddenPanels.has(id) && !layout.collapsedPanels.has(id)) {
            layout.toggleCollapse(id);
          }
        }
        push([{ type: 'success', text: 'All panels collapsed.' }]);
        break;
      }

      case 'expand-all': {
        for (const id of layout.panelOrder) {
          if (layout.collapsedPanels.has(id)) {
            layout.toggleCollapse(id);
          }
        }
        push([{ type: 'success', text: 'All panels expanded.' }]);
        break;
      }

      case 'organize': {
        layout.setIsOrganizing(!layout.isOrganizing);
        push([{ type: 'success', text: `Organize mode ${layout.isOrganizing ? 'OFF' : 'ON'}.` }]);
        break;
      }

      case 'fullscreen': {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        push([{ type: 'success', text: 'Toggled fullscreen.' }]);
        break;
      }

      case 'uptime': {
        const ms = Date.now() - startTime;
        const s = Math.floor(ms / 1000) % 60;
        const m = Math.floor(ms / 60000) % 60;
        const h = Math.floor(ms / 3600000);
        push([{ type: 'output', text: `Session uptime: ${h}h ${m}m ${s}s` }]);
        break;
      }

      case 'clear': {
        setHistory([]);
        break;
      }

      case 'exit':
      case 'quit':
      case 'q': {
        onClose();
        break;
      }

      case 'version': {
        push([
          { type: 'output', text: 'TerminalFeed.io v1.0.0' },
          { type: 'output', text: 'Built with React + Vite' },
          { type: 'output', text: '\u00A9 2025 Pizza Robot Studios' },
        ]);
        break;
      }

      case 'theme': {
        push([
          { type: 'output', text: '── Theme: MIDNIGHT ──' },
          { type: 'output', text: '  bg:     #080808' },
          { type: 'success', text: '  green:  #4ADE80' },
          { type: 'error', text: '  red:    #F87171' },
          { type: 'output', text: '  text:   #C8C8C0' },
          { type: 'output', text: '  font:   JetBrains Mono' },
        ]);
        break;
      }

      case 'stats': {
        const visible = layout.panelOrder.filter(p => !layout.hiddenPanels.has(p));
        const collapsed = layout.panelOrder.filter(p => layout.collapsedPanels.has(p));
        push([
          { type: 'output', text: '── Dashboard Stats ──' },
          { type: 'output', text: `  Total panels:    ${layout.panelOrder.length}` },
          { type: 'success', text: `  Visible:         ${visible.length}` },
          { type: 'error', text: `  Hidden:          ${layout.hiddenPanels.size}` },
          { type: 'output', text: `  Collapsed:       ${collapsed.length}` },
          { type: 'output', text: `  Organize mode:   ${layout.isOrganizing ? 'ON' : 'OFF'}` },
        ]);
        break;
      }

      case 'motd': {
        push([{ type: 'success', text: MOTD[Math.floor(Math.random() * MOTD.length)] }]);
        break;
      }

      default: {
        push([{ type: 'error', text: `Unknown command: "${cmd}". Type "help" for available commands.` }]);
      }
    }
  }, [layout, onClose, push]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!authed) {
        handleLogin(input);
      } else {
        exec(input);
      }
      setInput('');
    } else if (e.key === 'ArrowUp' && authed) {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = cmdHistoryIdx === -1 ? cmdHistory.length - 1 : Math.max(0, cmdHistoryIdx - 1);
        setCmdHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    } else if (e.key === 'ArrowDown' && authed) {
      e.preventDefault();
      if (cmdHistoryIdx >= 0) {
        const newIdx = cmdHistoryIdx + 1;
        if (newIdx >= cmdHistory.length) {
          setCmdHistoryIdx(-1);
          setInput('');
        } else {
          setCmdHistoryIdx(newIdx);
          setInput(cmdHistory[newIdx]);
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="atOverlay" onClick={onClose}>
      <div className="atModal" onClick={e => e.stopPropagation()}>
        <div className="atTitlebar">
          <span className="atTitle">{authed ? 'ADMIN TERMINAL' : 'AUTHENTICATION REQUIRED'}</span>
          <div className="atDots">
            <span className={`atDot ${authed ? 'atDotGreen' : 'atDotRed'}`} />
            <span className="atDot atDotAmber" />
            <span className="atDot atDotRed" onClick={onClose} title="Close" />
          </div>
        </div>
        <div className="atBody" ref={scrollRef} onClick={() => inputRef.current?.focus()}>
          {history.map((entry, i) => (
            <div key={i} className={`atLine atLine--${entry.type}`}>
              {entry.text}
            </div>
          ))}
          <div className="atInputLine">
            <span className="atPrompt">{authed ? '>' : '\u25B6'}</span>
            <input
              ref={inputRef}
              className="atInput"
              type={authed ? 'text' : 'password'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              placeholder={authed ? '' : 'access code...'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
