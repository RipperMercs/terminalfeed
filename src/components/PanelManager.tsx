import { useState, useRef } from 'react';
import { ALL_PANELS, PRESETS, type LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  layout: LayoutManager;
  onClose: () => void;
}

export function PanelManager({ layout, onClose }: Props) {
  const [importMode, setImportMode] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = layout.importLayout(importText.trim());
    if (ok) {
      setImportMode(false);
      setImportText('');
      setImportError('');
    } else {
      setImportError('Invalid layout data');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const ok = layout.importLayout(text);
      if (!ok) setImportError('Invalid layout file');
      else {
        setImportMode(false);
        setImportError('');
      }
    };
    reader.readAsText(file);
  };

  // Build ordered list: saved order first, then any new panels not in order
  const orderedPanels = [...layout.panelOrder]
    .map(id => ALL_PANELS.find(p => p.id === id))
    .filter(Boolean) as typeof ALL_PANELS[number][];

  // Add any panels that aren't in the saved order (new panels)
  for (const p of ALL_PANELS) {
    if (!orderedPanels.find(op => op.id === p.id)) {
      orderedPanels.push(p);
    }
  }

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const order = orderedPanels.map(p => p.id);
    [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
    layout.setPanelOrder(order);
  };

  const moveDown = (idx: number) => {
    if (idx >= orderedPanels.length - 1) return;
    const order = orderedPanels.map(p => p.id);
    [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
    layout.setPanelOrder(order);
  };

  return (
    <div className="pmOverlay" onClick={onClose}>
      <div className="pmModal" onClick={e => e.stopPropagation()}>
        <div className="pmHeader">
          <span className="pmTitle">Panel Manager</span>
          <button className="pmClose" onClick={onClose}>ESC</button>
        </div>

        <div className="pmBody">
          {/* Presets */}
          <div className="pmPresets">
            <span className="pmPresetsLabel">PRESETS</span>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                className="pmPresetBtn"
                onClick={() => layout.applyPreset(key)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="pmHint">Toggle panels on/off. Reorder with arrows.</div>

          <div className="pmList">
            {orderedPanels.map((panel, idx) => {
              const visible = layout.isVisible(panel.id);
              return (
                <div key={panel.id} className={`pmItem ${visible ? '' : 'pmItemHidden'}`}>
                  <button
                    className={`pmToggle ${visible ? 'pmToggleOn' : 'pmToggleOff'}`}
                    onClick={() => layout.toggleHidden(panel.id)}
                  >
                    {visible ? 'ON' : 'OFF'}
                  </button>
                  <span className="pmLabel">{panel.label}</span>
                  <div className="pmArrows">
                    <button className="pmArrow" onClick={() => moveUp(idx)} disabled={idx === 0}>^</button>
                    <button className="pmArrow" onClick={() => moveDown(idx)} disabled={idx === orderedPanels.length - 1}>v</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {importMode ? (
          <div className="pmImportArea">
            <textarea
              className="pmImportInput"
              placeholder="Paste TF-LAYOUT:... code here"
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError(''); }}
              rows={3}
            />
            {importError && <div className="pmError">{importError}</div>}
            <div className="pmImportActions">
              <button className="pmBtn" onClick={handleImport}>Apply</button>
              <button className="pmBtn" onClick={() => fileInputRef.current?.click()}>Upload File</button>
              <button className="pmBtn pmBtnDim" onClick={() => setImportMode(false)}>Cancel</button>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileImport} />
          </div>
        ) : (
          <div className="pmFooter">
            <div className="pmFooterRow">
              <button className="pmBtn" onClick={() => layout.exportLayout()}>Export</button>
              <button className="pmBtn" onClick={() => setImportMode(true)}>Import</button>
              <button className="pmBtn" onClick={() => layout.downloadLayout()}>Download</button>
              <button className="pmBtn" onClick={() => layout.shareLayout()}>Share Link</button>
            </div>
            <div className="pmFooterRow">
              <button className="pmBtn pmBtnRandom" onClick={layout.randomizeLayout}>Randomize</button>
              {layout.canUndoRandomize && (
                <button className="pmBtn pmBtnUndo" onClick={layout.undoRandomize}>Undo Randomize</button>
              )}
              <button className="pmBtn pmBtnDanger" onClick={layout.resetLayout}>Reset Default</button>
              <button className="pmBtn pmBtnPrimary" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
