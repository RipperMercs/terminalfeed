import { useState, useCallback, useEffect, useRef } from 'react';

// All panel IDs in default order
export const ALL_PANELS = [
  { id: 'bitcoin', label: 'Bitcoin Price', defaultSpan: 2 },
  { id: 'crypto', label: 'Crypto', defaultSpan: 1 },
  { id: 'btc-network', label: 'BTC Network', defaultSpan: 2 },
  { id: 'news', label: 'Tech / AI Feed', defaultSpan: 1 },
  { id: 'reddit', label: 'Reddit', defaultSpan: 1 },
  { id: 'github', label: 'GitHub Trending', defaultSpan: 1 },
  { id: 'market-hours', label: 'Market Hours', defaultSpan: 1 },
  { id: 'markets', label: 'Markets (US)', defaultSpan: 1 },
  { id: 'scores', label: 'Sports Scores', defaultSpan: 2 },
  { id: 'dev-status', label: 'Dev/Ops Status', defaultSpan: 1 },
  { id: 'crypto-global', label: 'Crypto Market', defaultSpan: 1 },
  { id: 'weather', label: 'Weather', defaultSpan: 1 },
  { id: 'seismic', label: 'Earthquakes', defaultSpan: 1 },
  { id: 'launches', label: 'Space Launches', defaultSpan: 1 },
  { id: 'steam', label: 'Steam Games', defaultSpan: 1 },
  { id: 'stackoverflow', label: 'Stack Overflow', defaultSpan: 1 },
  { id: 'nasa', label: 'NASA APOD', defaultSpan: 1 },
  { id: 'quick-stats', label: 'Quick Stats', defaultSpan: 1 },
  { id: 'recipe', label: "Tonight's Recipe", defaultSpan: 1 },
  { id: 'daily-learn', label: 'Daily Learn', defaultSpan: 1 },
  { id: 'support', label: 'Support / Donate', defaultSpan: 1 },
] as const;

export type PanelId = typeof ALL_PANELS[number]['id'];

const LS_HIDDEN = 'tf_hidden_panels';
const LS_COLLAPSED = 'tf_collapsed_panels';
const LS_ORDER = 'tf_panel_order';

function loadArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveArray(key: string, arr: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}

export interface LayoutExport {
  version: number;
  exported: string;
  hiddenPanels: string[];
  collapsedPanels: string[];
  panelOrder: string[];
}

export interface LayoutManager {
  hiddenPanels: Set<string>;
  collapsedPanels: Set<string>;
  panelOrder: string[];
  isVisible: (id: string) => boolean;
  isCollapsed: (id: string) => boolean;
  toggleHidden: (id: string) => void;
  toggleCollapse: (id: string) => void;
  setPanelOrder: (order: string[]) => void;
  resetLayout: () => void;
  exportLayout: () => string;
  importLayout: (data: string) => boolean;
  downloadLayout: () => void;
  toastMessage: string;
}

export function useLayoutManager(): LayoutManager {
  const [hiddenPanels, setHiddenPanels] = useState<Set<string>>(() => new Set(loadArray(LS_HIDDEN)));
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(() => new Set(loadArray(LS_COLLAPSED)));
  const [panelOrder, setPanelOrderState] = useState<string[]>(() => {
    const saved = loadArray(LS_ORDER);
    if (saved.length > 0) return saved;
    return ALL_PANELS.map(p => p.id);
  });
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(''), 1500);
  }, []);

  // Auto-save hidden panels
  useEffect(() => {
    saveArray(LS_HIDDEN, Array.from(hiddenPanels));
  }, [hiddenPanels]);

  // Auto-save collapsed panels
  useEffect(() => {
    saveArray(LS_COLLAPSED, Array.from(collapsedPanels));
  }, [collapsedPanels]);

  // Auto-save panel order
  useEffect(() => {
    saveArray(LS_ORDER, panelOrder);
  }, [panelOrder]);

  const isVisible = useCallback((id: string) => !hiddenPanels.has(id), [hiddenPanels]);
  const isCollapsed = useCallback((id: string) => collapsedPanels.has(id), [collapsedPanels]);

  const toggleHidden = useCallback((id: string) => {
    setHiddenPanels(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Panel restored');
      } else {
        next.add(id);
        showToast('Panel hidden');
      }
      return next;
    });
  }, [showToast]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedPanels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setPanelOrder = useCallback((order: string[]) => {
    setPanelOrderState(order);
    showToast('Layout saved');
  }, [showToast]);

  const resetLayout = useCallback(() => {
    setHiddenPanels(new Set());
    setCollapsedPanels(new Set());
    setPanelOrderState(ALL_PANELS.map(p => p.id));
    localStorage.removeItem(LS_HIDDEN);
    localStorage.removeItem(LS_COLLAPSED);
    localStorage.removeItem(LS_ORDER);
    showToast('Layout reset');
  }, [showToast]);

  const exportLayout = useCallback((): string => {
    const data: LayoutExport = {
      version: 1,
      exported: new Date().toISOString(),
      hiddenPanels: Array.from(hiddenPanels),
      collapsedPanels: Array.from(collapsedPanels),
      panelOrder,
    };
    const json = JSON.stringify(data);
    const encoded = btoa(json);
    const code = `TF-LAYOUT:${encoded}`;

    navigator.clipboard.writeText(code).then(() => {
      showToast('Layout copied to clipboard');
    }).catch(() => {
      showToast('Export ready — copy failed');
    });

    return code;
  }, [hiddenPanels, collapsedPanels, panelOrder, showToast]);

  const importLayout = useCallback((raw: string): boolean => {
    try {
      let data: LayoutExport;

      if (raw.startsWith('TF-LAYOUT:')) {
        const encoded = raw.slice('TF-LAYOUT:'.length);
        data = JSON.parse(atob(encoded));
      } else if (raw.startsWith('{')) {
        data = JSON.parse(raw);
      } else {
        return false;
      }

      if (data.version !== 1 || !Array.isArray(data.hiddenPanels)) return false;

      setHiddenPanels(new Set(data.hiddenPanels));
      setCollapsedPanels(new Set(data.collapsedPanels ?? []));
      if (data.panelOrder?.length > 0) setPanelOrderState(data.panelOrder);

      showToast('Layout imported');
      return true;
    } catch {
      return false;
    }
  }, [showToast]);

  const downloadLayout = useCallback(() => {
    const data: LayoutExport = {
      version: 1,
      exported: new Date().toISOString(),
      hiddenPanels: Array.from(hiddenPanels),
      collapsedPanels: Array.from(collapsedPanels),
      panelOrder,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terminalfeed-layout.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Layout downloaded');
  }, [hiddenPanels, collapsedPanels, panelOrder, showToast]);

  return {
    hiddenPanels,
    collapsedPanels,
    panelOrder,
    isVisible,
    isCollapsed,
    toggleHidden,
    toggleCollapse,
    setPanelOrder,
    resetLayout,
    exportLayout,
    importLayout,
    downloadLayout,
    toastMessage,
  };
}
