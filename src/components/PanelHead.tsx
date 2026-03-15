import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  panelId: string;
  layout: LayoutManager;
  getGridCols: () => number;
  isStale?: boolean;
  children: React.ReactNode;
}

const LOCKED_PANELS = ['support'];

export function PanelHead({ panelId, layout, isStale, children }: Props) {
  const isLocked = LOCKED_PANELS.includes(panelId);

  // Simple move: swap with adjacent panel in the order array
  const moveUp = () => {
    const order = layout.panelOrder;
    const visible = order.filter(id => layout.isVisible(id));
    const idx = visible.indexOf(panelId);
    if (idx <= 0) return;
    // Find actual indices in full order and swap
    const fullIdxA = order.indexOf(visible[idx]);
    const fullIdxB = order.indexOf(visible[idx - 1]);
    const next = [...order];
    [next[fullIdxA], next[fullIdxB]] = [next[fullIdxB], next[fullIdxA]];
    layout.setPanelOrder(next);
  };

  const moveDown = () => {
    const order = layout.panelOrder;
    const visible = order.filter(id => layout.isVisible(id));
    const idx = visible.indexOf(panelId);
    if (idx >= visible.length - 1) return;
    const fullIdxA = order.indexOf(visible[idx]);
    const fullIdxB = order.indexOf(visible[idx + 1]);
    const next = [...order];
    [next[fullIdxA], next[fullIdxB]] = [next[fullIdxB], next[fullIdxA]];
    layout.setPanelOrder(next);
  };

  return (
    <div className="panelHeader">
      {children}
      {isStale && <span className="staleIndicator">delayed</span>}
      {layout.isOrganizing && !isLocked && (
        <div className="orgControls">
          <button className="orgArrow" onClick={moveUp} title="Move up">&#9650;</button>
          <button className="orgArrow" onClick={moveDown} title="Move down">&#9660;</button>
          <button className="orgHide" onClick={() => layout.toggleHidden(panelId)} title="Hide panel">&#128065;</button>
        </div>
      )}
      {layout.isOrganizing && isLocked && (
        <span className="orgLocked">pinned</span>
      )}
    </div>
  );
}
