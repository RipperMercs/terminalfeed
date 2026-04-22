import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  panelId: string;
  layout: LayoutManager;
  getGridCols: () => number;
  isStale?: boolean;
  children: React.ReactNode;
}

function findVisualNeighbor(panelId: string, direction: 'up' | 'down' | 'left' | 'right'): string | null {
  // Get all visible panel elements and their positions on screen
  const allPanels = Array.from(document.querySelectorAll('.grid > .panel, .grid > div[class*="panel"]'));
  const rects: { id: string; rect: DOMRect }[] = [];

  for (const el of allPanels) {
    // Find the panel ID from the panelHeader inside
    const header = el.querySelector('.panelHeader');
    if (!header) continue;
    // Match panel ID via the PanelHead's data or find it from orgControls/hide button
    const id = el.getAttribute('data-panel-id');
    if (!id) continue;
    rects.push({ id, rect: el.getBoundingClientRect() });
  }

  const current = rects.find(r => r.id === panelId);
  if (!current) return null;

  const cx = current.rect.left + current.rect.width / 2;
  const cy = current.rect.top + current.rect.height / 2;

  let best: string | null = null;
  let bestDist = Infinity;

  for (const candidate of rects) {
    if (candidate.id === panelId) continue;
    const rx = candidate.rect.left + candidate.rect.width / 2;
    const ry = candidate.rect.top + candidate.rect.height / 2;

    let valid = false;
    switch (direction) {
      case 'up':    valid = ry < cy - 10; break;
      case 'down':  valid = ry > cy + 10; break;
      case 'left':  valid = rx < cx - 10; break;
      case 'right': valid = rx > cx + 10; break;
    }
    if (!valid) continue;

    // Distance: weight primary axis more heavily
    const dx = rx - cx;
    const dy = ry - cy;
    let dist: number;
    if (direction === 'up' || direction === 'down') {
      dist = Math.abs(dy) + Math.abs(dx) * 0.5; // prefer same column
    } else {
      dist = Math.abs(dx) + Math.abs(dy) * 0.5; // prefer same row
    }

    if (dist < bestDist) {
      bestDist = dist;
      best = candidate.id;
    }
  }

  return best;
}

export function PanelHead({ panelId, layout, isStale, children }: Props) {
  const moveVisual = (direction: 'up' | 'down' | 'left' | 'right') => {
    const targetId = findVisualNeighbor(panelId, direction);
    if (!targetId) return;

    const order = [...layout.panelOrder];
    const fromIdx = order.indexOf(panelId);
    const toIdx = order.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    // Remove from current position and insert at target position
    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, panelId);
    layout.setPanelOrder(order);
  };

  return (
    <div className="panelHeader">
      {children}
      {isStale && <span className="staleIndicator">delayed</span>}
      {layout.isOrganizing && (
        <div className="orgControls">
          <span className="orgDragHandle" title="Drag to reorder" role="button" aria-label={`Reorder ${panelId} panel`} tabIndex={0}>&#x2807;</span>
          <button className="orgArrow" onClick={() => moveVisual('left')} title="Move left" aria-label={`Move ${panelId} panel left`}>&#9664;</button>
          <button className="orgArrow" onClick={() => moveVisual('up')} title="Move up" aria-label={`Move ${panelId} panel up`}>&#9650;</button>
          <button className="orgArrow" onClick={() => moveVisual('down')} title="Move down" aria-label={`Move ${panelId} panel down`}>&#9660;</button>
          <button className="orgArrow" onClick={() => moveVisual('right')} title="Move right" aria-label={`Move ${panelId} panel right`}>&#9654;</button>
          <button className="orgHide" onClick={() => layout.toggleHidden(panelId)} title="Hide panel" aria-label={`Hide ${panelId} panel`}>&#128065;</button>
        </div>
      )}
    </div>
  );
}
