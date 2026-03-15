import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  panelId: string;
  layout: LayoutManager;
  getGridCols: () => number;
  isStale?: boolean;
  children: React.ReactNode;
}

export function PanelHead({ panelId, layout, isStale, children }: Props) {
  const move = (offset: number) => {
    const order = layout.panelOrder;
    const visible = order.filter(id => layout.isVisible(id));
    const idx = visible.indexOf(panelId);
    if (idx < 0) return;

    const targetIdx = idx + offset;
    if (targetIdx < 0 || targetIdx >= visible.length) return;

    const fullIdxA = order.indexOf(visible[idx]);
    const fullIdxB = order.indexOf(visible[targetIdx]);
    const next = [...order];
    [next[fullIdxA], next[fullIdxB]] = [next[fullIdxB], next[fullIdxA]];
    layout.setPanelOrder(next);
  };

  return (
    <div className="panelHeader">
      {children}
      {isStale && <span className="staleIndicator">delayed</span>}
      {layout.isOrganizing && (
        <div className="orgControls">
          <span className="orgDragHandle" title="Drag to reorder">&#x2807;</span>
          <button className="orgArrow" onClick={() => move(-1)} title="Move up">&#9650;</button>
          <button className="orgArrow" onClick={() => move(1)} title="Move down">&#9660;</button>
          <button className="orgHide" onClick={() => layout.toggleHidden(panelId)} title="Hide panel">&#128065;</button>
        </div>
      )}
    </div>
  );
}
