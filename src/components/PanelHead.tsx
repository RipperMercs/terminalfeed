import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  panelId: string;
  layout: LayoutManager;
  getGridCols: () => number;
  isStale?: boolean;
  children: React.ReactNode;
}

const LOCKED_PANELS = ['support'];

export function PanelHead({ panelId, layout, getGridCols, isStale, children }: Props) {
  const isLocked = LOCKED_PANELS.includes(panelId);

  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
    const order = layout.panelOrder;
    const visible = order.filter(id => layout.isVisible(id));
    const idx = visible.indexOf(panelId);
    if (idx < 0) return;

    // In CSS columns, items flow top-to-bottom in each column.
    // "Up" = previous item, "Down" = next item
    // "Left" = jump backward by ~items-per-column, "Right" = jump forward
    const cols = getGridCols();
    const itemsPerCol = Math.ceil(visible.length / cols);

    let targetIdx: number;
    switch (direction) {
      case 'up': targetIdx = idx - 1; break;
      case 'down': targetIdx = idx + 1; break;
      case 'left': targetIdx = idx - itemsPerCol; break;
      case 'right': targetIdx = idx + itemsPerCol; break;
    }

    if (targetIdx < 0 || targetIdx >= visible.length) return;

    // Swap in the full order array
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
      {layout.isOrganizing && !isLocked && (
        <div className="orgControls">
          <button className="orgArrow" onClick={() => move('left')} title="Move left">&#9664;</button>
          <button className="orgArrow" onClick={() => move('up')} title="Move up">&#9650;</button>
          <button className="orgArrow" onClick={() => move('down')} title="Move down">&#9660;</button>
          <button className="orgArrow" onClick={() => move('right')} title="Move right">&#9654;</button>
          <button className="orgHide" onClick={() => layout.toggleHidden(panelId)} title="Hide panel">&#128065;</button>
        </div>
      )}
      {layout.isOrganizing && isLocked && (
        <span className="orgLocked">pinned</span>
      )}
    </div>
  );
}
