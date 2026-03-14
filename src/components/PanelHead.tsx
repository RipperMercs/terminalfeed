import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  panelId: string;
  layout: LayoutManager;
  getGridCols: () => number;
  children: React.ReactNode;
}

// Panels that are permanently locked (can't be moved, hidden, or collapsed)
const LOCKED_PANELS = ['bitcoin', 'weather', 'news', 'dev-status', 'support'];

export function PanelHead({ panelId, layout, getGridCols, children }: Props) {
  const isLocked = LOCKED_PANELS.includes(panelId);

  return (
    <div className="panelHeader">
      {children}
      {layout.isOrganizing && !isLocked && (
        <div className="orgControls">
          <button className="orgArrow" onClick={() => layout.swapPanels(panelId, 'left', getGridCols())} title="Move left">&#9664;</button>
          <button className="orgArrow" onClick={() => layout.swapPanels(panelId, 'up', getGridCols())} title="Move up">&#9650;</button>
          <button className="orgArrow" onClick={() => layout.swapPanels(panelId, 'down', getGridCols())} title="Move down">&#9660;</button>
          <button className="orgArrow" onClick={() => layout.swapPanels(panelId, 'right', getGridCols())} title="Move right">&#9654;</button>
          <button className="orgHide" onClick={() => layout.toggleHidden(panelId)} title="Hide panel">&#128065;</button>
        </div>
      )}
      {layout.isOrganizing && isLocked && (
        <span className="orgLocked">pinned</span>
      )}
    </div>
  );
}
