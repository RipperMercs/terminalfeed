import { useState, useCallback, useEffect, useRef } from 'react';
import { DEFAULT_LAYOUT } from '../data/defaultLayout';
import type { PanelHeat } from './usePanelHeat';

// All panel IDs in default order
// Default order: curated like a newspaper front page
// Top = most valuable data, bottom = niche/fun
export const ALL_PANELS = [
  // Row 1: The glance zone
  { id: 'bitcoin', label: 'Bitcoin Price', defaultSpan: 1 },
  // Row 2: Money
  { id: 'markets', label: 'Markets (US)', defaultSpan: 1 },
  { id: 'crypto', label: 'Crypto', defaultSpan: 1 },
  // Row 3: BTC deep dive
  { id: 'btc-network', label: 'BTC Network', defaultSpan: 1 },
  { id: 'market-hours', label: 'Market Hours', defaultSpan: 1 },
  // Row 4: Information
  { id: 'news', label: 'Tech / AI Feed', defaultSpan: 1 },
  { id: 'tech-news', label: 'Tech News', defaultSpan: 1 },
  { id: 'reddit', label: 'Reddit', defaultSpan: 1 },
  { id: 'github', label: 'GitHub Trending', defaultSpan: 1 },
  // Row 5: Dev/nerd
  { id: 'dev-status', label: 'Dev/Ops Status', defaultSpan: 1 },
  { id: 'stackoverflow', label: 'Stack Overflow', defaultSpan: 1 },
  // Row 6+: Supplementary
  { id: 'seismic', label: 'Earthquakes', defaultSpan: 1 },
  { id: 'weather', label: 'Weather', defaultSpan: 1 },
  { id: 'launches', label: 'Space Launches', defaultSpan: 1 },
  { id: 'daily-learn', label: 'Daily Learn', defaultSpan: 1 },
  // Row 7: Unique feeds
  { id: 'podcasts', label: 'Podcasts', defaultSpan: 1 },
  { id: 'uap', label: 'UAP Sightings', defaultSpan: 1 },
  { id: 'the-wire', label: 'The Wire', defaultSpan: 1 },
  { id: 'whale-watch', label: 'Whale Watch', defaultSpan: 1 },
  { id: 'wiki-live', label: 'Wikipedia Live', defaultSpan: 1 },
  { id: 'disasters', label: 'Global Alerts', defaultSpan: 1 },
  { id: 'gh-events', label: 'GitHub Live', defaultSpan: 1 },
  { id: 'books', label: 'Trending Books', defaultSpan: 1 },
  { id: 'forex', label: 'Forex Heatmap', defaultSpan: 1 },
  { id: 'hn-community', label: 'Show/Ask HN', defaultSpan: 1 },
  { id: 'wikipedia', label: 'Wikipedia', defaultSpan: 1 },
  { id: 'solar', label: 'Solar Weather', defaultSpan: 1 },
  { id: 'producthunt', label: 'Product Hunt', defaultSpan: 1 },
  { id: 'ai-leaderboard', label: 'AI Leaderboard', defaultSpan: 1 },
  { id: 'bluesky', label: 'Bluesky', defaultSpan: 1 },
  { id: 'internet-pulse', label: 'Internet Pulse', defaultSpan: 1 },
  // Bottom: Fun/lifestyle
  { id: 'in-space', label: 'Humans in Space', defaultSpan: 1 },
  { id: 'museum-art', label: 'Museum Art', defaultSpan: 1 },
  { id: 'daily-paws', label: 'Daily Paws', defaultSpan: 1 },
  { id: 'recipe', label: "Tonight's Recipe", defaultSpan: 1 },
  { id: 'support', label: 'Support / Donate', defaultSpan: 1 },
] as const;

export type PanelId = typeof ALL_PANELS[number]['id'];

const LS_HIDDEN = 'tf_hidden_panels';
const LS_COLLAPSED = 'tf_collapsed_panels';
const LS_ORDER = 'tf_panel_order';
const LS_CUSTOM = 'tf_has_custom_layout';
const LS_VERSION = 'tf_layout_version';
const CURRENT_VERSION = '20'; // bump this when panel lineup changes significantly

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

// Preset layouts
export const PRESETS: Record<string, { label: string; hidden: string[] }> = {
  everything: { label: 'Everything', hidden: [] },
  trader: {
    label: 'Trader',
    hidden: ['steam', 'stackoverflow', 'recipe', 'daily-learn', 'reddit', 'github'],
  },
  developer: {
    label: 'Developer',
    hidden: ['recipe', 'seismic', 'launches', 'steam', 'quick-stats'],
  },
  crypto: {
    label: 'Crypto',
    hidden: ['steam', 'stackoverflow', 'recipe', 'daily-learn', 'reddit', 'github', 'weather', 'seismic', 'launches'],
  },
};

export interface LayoutManager {
  hiddenPanels: Set<string>;
  collapsedPanels: Set<string>;
  panelOrder: string[];
  isOrganizing: boolean;
  setIsOrganizing: (v: boolean) => void;
  isVisible: (id: string) => boolean;
  isCollapsed: (id: string) => boolean;
  toggleHidden: (id: string) => void;
  toggleCollapse: (id: string) => void;
  setPanelOrder: (order: string[]) => void;
  swapPanels: (panelId: string, direction: 'left' | 'right' | 'up' | 'down', cols: number) => void;
  resetLayout: () => void;
  randomizeLayout: () => void;
  undoRandomize: () => void;
  canUndoRandomize: boolean;
  applyPreset: (presetKey: string) => void;
  applyHeatOrder: (heat: PanelHeat[]) => void;
  exportLayout: () => string;
  importLayout: (data: string) => boolean;
  downloadLayout: () => void;
  shareLayout: () => void;
  toastMessage: string;
}

export function useLayoutManager(): LayoutManager {
  // Version check: clear stale layouts when panel lineup changes
  const savedVersion = localStorage.getItem(LS_VERSION);
  if (savedVersion !== CURRENT_VERSION) {
    localStorage.removeItem(LS_ORDER);
    localStorage.removeItem(LS_HIDDEN);
    localStorage.removeItem(LS_COLLAPSED);
    localStorage.removeItem(LS_CUSTOM);
    localStorage.setItem(LS_VERSION, CURRENT_VERSION);
  }

  const [hiddenPanels, setHiddenPanels] = useState<Set<string>>(() => {
    const saved = loadArray(LS_HIDDEN);
    return saved.length > 0 ? new Set(saved) : new Set(DEFAULT_LAYOUT.hiddenPanels);
  });
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(() => {
    const saved = loadArray(LS_COLLAPSED);
    return saved.length > 0 ? new Set(saved) : new Set(DEFAULT_LAYOUT.collapsedPanels);
  });
  const [panelOrder, setPanelOrderState] = useState<string[]>(() => {
    const saved = loadArray(LS_ORDER);
    if (saved.length > 0) {
      // Merge: keep saved order, append any NEW panels that were added in updates
      const allIds: string[] = ALL_PANELS.map(p => p.id);
      const missing = allIds.filter(id => !saved.includes(id));
      // Remove any panels that no longer exist
      const cleaned = saved.filter(id => allIds.includes(id));
      return [...cleaned, ...missing];
    }
    return DEFAULT_LAYOUT.panelOrder;
  });
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRender = useRef(true);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(''), 1500);
  }, []);

  // Auto-save — skip initial render to prevent overwriting saved data
  // Set custom flag so heat system doesn't override user's choices
  useEffect(() => {
    if (initialRender.current) return;
    saveArray(LS_HIDDEN, Array.from(hiddenPanels));
    try { localStorage.setItem(LS_CUSTOM, 'true'); } catch {}
  }, [hiddenPanels]);

  useEffect(() => {
    if (initialRender.current) return;
    saveArray(LS_COLLAPSED, Array.from(collapsedPanels));
  }, [collapsedPanels]);

  useEffect(() => {
    if (initialRender.current) return;
    saveArray(LS_ORDER, panelOrder);
    try { localStorage.setItem(LS_CUSTOM, 'true'); } catch {}
  }, [panelOrder]);

  // Mark initial render complete after mount
  useEffect(() => {
    initialRender.current = false;
  }, []);

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

  const swapPanels = useCallback((panelId: string, direction: 'left' | 'right' | 'up' | 'down', cols: number) => {
    setPanelOrderState(prev => {
      // Work with visible panels only for position calculation
      const visible = prev.filter(id => !hiddenPanels.has(id));
      const currentIdx = visible.indexOf(panelId);
      if (currentIdx === -1) return prev;

      let targetIdx: number;
      switch (direction) {
        case 'left': targetIdx = currentIdx - 1; break;
        case 'right': targetIdx = currentIdx + 1; break;
        case 'up': targetIdx = currentIdx - cols; break;
        case 'down': targetIdx = currentIdx + cols; break;
      }

      if (targetIdx < 0 || targetIdx >= visible.length) return prev;

      // Find actual indices in the full array
      const fullIdxA = prev.indexOf(visible[currentIdx]);
      const fullIdxB = prev.indexOf(visible[targetIdx]);
      const next = [...prev];
      [next[fullIdxA], next[fullIdxB]] = [next[fullIdxB], next[fullIdxA]];
      return next;
    });
    showToast('Layout saved');
  }, [hiddenPanels, showToast]);

  const [preRandomOrder, setPreRandomOrder] = useState<string[] | null>(null);

  const randomizeLayout = useCallback(() => {
    // Save current layout so user can undo
    setPreRandomOrder([...panelOrder]);
    // Shuffle using Fisher-Yates, but keep 'support' pinned at end
    const pinned = ['support'];
    const movable = panelOrder.filter(id => !pinned.includes(id));
    for (let i = movable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [movable[i], movable[j]] = [movable[j], movable[i]];
    }
    // Pinned panels stay in place, shuffle everything else
    const shuffled = [...movable, ...(panelOrder.includes('support') ? ['support'] : [])];
    setPanelOrderState(shuffled);
    showToast('Layout randomized! Undo available in Settings');
  }, [panelOrder, showToast]);

  const undoRandomize = useCallback(() => {
    if (!preRandomOrder) return;
    setPanelOrderState(preRandomOrder);
    setPreRandomOrder(null);
    showToast('Previous layout restored');
  }, [preRandomOrder, showToast]);

  const resetLayout = useCallback(() => {
    setHiddenPanels(new Set(DEFAULT_LAYOUT.hiddenPanels));
    setCollapsedPanels(new Set(DEFAULT_LAYOUT.collapsedPanels));
    setPanelOrderState(DEFAULT_LAYOUT.panelOrder);
    localStorage.removeItem(LS_HIDDEN);
    localStorage.removeItem(LS_COLLAPSED);
    localStorage.removeItem(LS_ORDER);
    localStorage.removeItem(LS_CUSTOM);
    showToast('Layout reset to default');
  }, [showToast]);

  const applyHeatOrder = useCallback((heat: PanelHeat[]) => {
    // Only apply heat ordering if user has NOT customized
    const hasCustom = localStorage.getItem(LS_CUSTOM) === 'true';
    if (hasCustom) return; // respect user's custom order
    const heatOrder = heat.map(h => h.id).filter(id => ALL_PANELS.some(p => p.id === id));
    // Add any panels not in heat scores at the end
    const allIds = ALL_PANELS.map(p => p.id);
    const missing = allIds.filter(id => !heatOrder.includes(id));
    setPanelOrderState([...heatOrder, ...missing]);
  }, []);

  const applyPreset = useCallback((presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    setHiddenPanels(new Set(preset.hidden));
    setCollapsedPanels(new Set());
    setPanelOrderState(ALL_PANELS.map(p => p.id));
    showToast(`${preset.label} preset applied`);
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

  const shareLayout = useCallback(() => {
    const data: LayoutExport = {
      version: 1,
      exported: new Date().toISOString(),
      hiddenPanels: Array.from(hiddenPanels),
      collapsedPanels: Array.from(collapsedPanels),
      panelOrder,
    };
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?layout=${encoded}`;

    navigator.clipboard.writeText(url).then(() => {
      showToast('Layout link copied!');
    }).catch(() => {
      showToast('Share URL ready');
    });
  }, [hiddenPanels, collapsedPanels, panelOrder, showToast]);

  // Handle ?layout= URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const layoutParam = params.get('layout');
    if (!layoutParam) return;

    // Check for preset shorthand
    if (PRESETS[layoutParam]) {
      applyPreset(layoutParam);
    } else {
      // Try base64 decode
      try {
        const data: LayoutExport = JSON.parse(atob(layoutParam));
        if (data.version === 1 && Array.isArray(data.hiddenPanels)) {
          setHiddenPanels(new Set(data.hiddenPanels));
          setCollapsedPanels(new Set(data.collapsedPanels ?? []));
          if (data.panelOrder?.length > 0) setPanelOrderState(data.panelOrder);
          showToast('Shared layout applied');
        }
      } catch {}
    }

    // Strip the layout param from URL
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, '', cleanUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    isOrganizing,
    setIsOrganizing,
    isVisible,
    isCollapsed,
    toggleHidden,
    toggleCollapse,
    setPanelOrder,
    swapPanels,
    resetLayout,
    randomizeLayout,
    undoRandomize,
    canUndoRandomize: preRandomOrder !== null,
    applyPreset,
    applyHeatOrder,
    exportLayout,
    importLayout,
    downloadLayout,
    shareLayout,
    toastMessage,
  };
}
