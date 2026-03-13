import { useState, useRef, useCallback, useEffect } from 'react';
import { C } from './utils/colors';
import { CATEGORY_LIST, CATEGORY_DATA } from './data/categoryRegistry';
import { useCategoryData } from './hooks/useCategoryData';
import CategorySelector from './components/CategorySelector';
import LeftPanel from './components/LeftPanel';
import MiddlePanel from './components/MiddlePanel';
import RFQPreview from './components/RFQPreview';
import MasterEditor from './components/MasterEditor';

function TopBar({
  categoryId, onCategoryChange, onReset, onSave, onExportJSON, onImportJSON,
  onExportWord, onUndo, onRedo, canUndo, canRedo, frozen, onToggleFreeze, saved,
  onOpenMaster,
}) {
  const fileRef = useRef(null);

  return (
    <div style={{
      height: 44,
      background: C.dk,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 8,
      flexShrink: 0,
    }}>
      <span style={{ color: C.o, fontWeight: 700, fontSize: 15 }}>
        STM<span style={{ color: '#fff', fontWeight: 300, marginLeft: 3, fontSize: 11, opacity: .6 }}>GROUP</span>
      </span>
      <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>RFQ Text Block Editor</span>
      <span style={{ color: 'rgba(255,255,255,.3)' }}>&mdash;</span>
      <CategorySelector value={categoryId} onChange={onCategoryChange} />
      <div style={{ flex: 1 }} />

      {saved && (
        <span style={{ color: C.gr, fontSize: 10, fontWeight: 600, transition: 'opacity .3s' }}>Saved</span>
      )}

      {/* Undo/Redo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        style={{
          padding: '4px 8px', background: 'transparent',
          border: '1px solid rgba(255,255,255,.15)', color: canUndo ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.2)',
          borderRadius: 4, fontSize: 10, cursor: canUndo ? 'pointer' : 'default',
        }}
      >
        Undo
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        style={{
          padding: '4px 8px', background: 'transparent',
          border: '1px solid rgba(255,255,255,.15)', color: canRedo ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.2)',
          borderRadius: 4, fontSize: 10, cursor: canRedo ? 'pointer' : 'default',
        }}
      >
        Redo
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        style={{
          padding: '4px 10px', background: 'transparent',
          border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.5)',
          borderRadius: 4, fontSize: 10, cursor: 'pointer',
        }}
      >
        Reset
      </button>

      {/* Freeze */}
      <button
        onClick={onToggleFreeze}
        style={{
          padding: '4px 10px', background: frozen ? C.bl : 'transparent',
          border: `1px solid ${frozen ? C.bl : 'rgba(255,255,255,.15)'}`,
          color: frozen ? '#fff' : 'rgba(255,255,255,.5)',
          borderRadius: 4, fontSize: 10, cursor: 'pointer',
        }}
      >
        {frozen ? 'Unfreeze' : 'Freeze'}
      </button>

      {/* Save JSON */}
      <button
        onClick={onExportJSON}
        style={{
          padding: '4px 10px', background: 'transparent',
          border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.5)',
          borderRadius: 4, fontSize: 10, cursor: 'pointer',
        }}
      >
        Save JSON
      </button>

      {/* Load JSON */}
      <button
        onClick={() => fileRef.current?.click()}
        style={{
          padding: '4px 10px', background: 'transparent',
          border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.5)',
          borderRadius: 4, fontSize: 10, cursor: 'pointer',
        }}
      >
        Load JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
              try {
                const data = JSON.parse(ev.target.result);
                onImportJSON(data);
              } catch {
                alert('Invalid JSON file');
              }
            };
            reader.readAsText(file);
          }
          e.target.value = '';
        }}
      />

      {/* Master Editor */}
      <button
        onClick={onOpenMaster}
        style={{
          padding: '4px 10px', background: 'transparent',
          border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.5)',
          borderRadius: 4, fontSize: 10, cursor: 'pointer',
        }}
      >
        Master Chapters
      </button>

      {/* Export Word */}
      <button
        onClick={onExportWord}
        style={{
          padding: '4px 10px', background: C.o,
          border: 'none', color: '#fff',
          borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Export Word
      </button>
    </div>
  );
}

export default function App() {
  const [categoryId, setCategoryId] = useState('metal_sandwich_panel');
  const [cols, setCols] = useState({ l: 260, r: 380 });
  const [drag, setDrag] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showMaster, setShowMaster] = useState(false);
  const dragRef = useRef({ x: 0, w: 0 });

  // Undo/redo stacks
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const undoTimerRef = useRef(null);

  const {
    state, save, setActiveBlock, toggleBlock, setVal, toggleDelegate,
    toggleDelegateBlock, toggleAltVar, toggleAltProduct, removeVar,
    restoreVar, restoreAllVars, updateText, resetCategory, setSpecOrder,
    addCustomSpec, toggleFreeze, setReview, getOriginalText, importState,
  } = useCategoryData(categoryId);

  // Push undo snapshot (debounced)
  const pushUndo = useCallback(() => {
    if (!state) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      const snapshot = JSON.stringify({
        selected: Array.from(state.selected),
        vals: state.vals,
        supVars: state.supVars,
        delBlocks: Array.from(state.delBlocks),
        removedVars: state.removedVars,
        altVars: state.altVars,
        altProduct: state.altProduct,
        editedTexts: state.editedTexts,
        specOrder: state.specOrder,
        customSpecs: state.customSpecs,
      });
      setUndoStack(prev => {
        const stack = [...prev, snapshot];
        return stack.length > 50 ? stack.slice(-50) : stack;
      });
      setRedoStack([]);
    }, 300);
  }, [state]);

  // Wrap state-changing actions with undo tracking
  const tracked = (fn) => (...args) => {
    pushUndo();
    return fn(...args);
  };

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const current = JSON.stringify({
      selected: Array.from(state.selected),
      vals: state.vals,
      supVars: state.supVars,
      delBlocks: Array.from(state.delBlocks),
      removedVars: state.removedVars,
      altVars: state.altVars,
      altProduct: state.altProduct,
      editedTexts: state.editedTexts,
      specOrder: state.specOrder,
      customSpecs: state.customSpecs,
    });
    setRedoStack(prev => [...prev, current]);
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    importState(JSON.parse(prev));
  }, [undoStack, state, importState]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const current = JSON.stringify({
      selected: Array.from(state.selected),
      vals: state.vals,
      supVars: state.supVars,
      delBlocks: Array.from(state.delBlocks),
      removedVars: state.removedVars,
      altVars: state.altVars,
      altProduct: state.altProduct,
      editedTexts: state.editedTexts,
      specOrder: state.specOrder,
      customSpecs: state.customSpecs,
    });
    setUndoStack(prev => [...prev, current]);
    const next = redoStack[redoStack.length - 1];
    setRedoStack(s => s.slice(0, -1));
    importState(JSON.parse(next));
  }, [redoStack, state, importState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExportWord();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  // Resizable columns
  const onMouseDown = useCallback((side, e) => {
    e.preventDefault();
    dragRef.current = { x: e.clientX, w: cols[side] };
    setDrag(side);
  }, [cols]);

  const onMouseMove = useCallback((e) => {
    if (!drag) return;
    const dx = e.clientX - dragRef.current.x;
    setCols(p => ({
      ...p,
      [drag]: Math.max(
        drag === 'l' ? 200 : 280,
        Math.min(drag === 'l' ? 450 : 550, dragRef.current.w + (drag === 'l' ? dx : -dx))
      ),
    }));
  }, [drag]);

  const onMouseUp = useCallback(() => setDrag(null), []);

  // Auto-save on category switch
  const handleCategoryChange = useCallback((newId) => {
    save();
    setUndoStack([]);
    setRedoStack([]);
    setCategoryId(newId);
  }, [save]);

  const handleSave = useCallback(() => {
    save();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [save]);

  const handleReset = useCallback(() => {
    if (!confirm('Reset this category to default? All edits will be lost.')) return;
    resetCategory();
    setUndoStack([]);
    setRedoStack([]);
  }, [resetCategory]);

  const handleToggleFreeze = useCallback(() => {
    if (state?.frozen) {
      if (!confirm('Unfreeze this category? It will become editable again.')) return;
    } else {
      if (!confirm('Freeze this category? Text editing will be locked (variables remain fillable).')) return;
    }
    toggleFreeze();
  }, [state?.frozen, toggleFreeze]);

  const handleExportJSON = useCallback(() => {
    if (!state) return;
    const exportData = {
      categoryId: state.categoryId,
      selected: Array.from(state.selected),
      activeBlock: state.activeBlock,
      vals: state.vals,
      supVars: state.supVars,
      delBlocks: Array.from(state.delBlocks),
      removedVars: state.removedVars,
      altVars: state.altVars,
      altProduct: state.altProduct,
      editedTexts: state.editedTexts,
      specOrder: state.specOrder,
      customSpecs: state.customSpecs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfq_${state.categoryId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const handleImportJSON = useCallback((data) => {
    if (!confirm(`This will replace all current edits for ${categoryId}. Continue?`)) return;
    importState(data);
  }, [categoryId, importState]);

  const handleExportWord = useCallback(() => {
    if (!state) return;
    const companyName = state.vals?.b1_intro?.companyName || 'Staalmeesters Projects BV';
    const projectName = state.vals?.b1_intro?.projectName || '';
    const projectNumber = state.vals?.b1_intro?.projectNumber || '';
    const supplierName = state.vals?.b1_intro?.supplierName || '';
    const catInfo = CATEGORY_LIST.find(c => c.id === categoryId);

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8">
<style>
  body { font-family: 'HK Guise Light', Calibri, sans-serif; font-size: 10pt; line-height: 1.6; color: #333; }
  h1 { font-family: 'HK Guise', Calibri, sans-serif; color: #C52F05; font-size: 14pt; border-bottom: 1.5pt solid #C52F05; padding-bottom: 4pt; margin-top: 24pt; }
  h2 { font-family: 'HK Guise', Calibri, sans-serif; font-size: 12pt; color: #22293B; margin-top: 16pt; }
  .cover { margin-bottom: 40pt; }
  .cover-title { font-family: 'HK Guise', Calibri, sans-serif; color: #C52F05; font-size: 18pt; }
  .cover-table td { padding: 4pt 8pt; font-size: 10pt; vertical-align: top; }
  .cover-table td:first-child { font-weight: bold; color: #22293B; width: 120pt; }
  .delegated { color: #4A90D9; font-style: italic; }
  .alt-section { background: #FEF3C7; border-left: 3pt solid #D97706; padding: 6pt 10pt; margin: 8pt 0; color: #D97706; }
  ul { padding-left: 24pt; }
  li { margin-bottom: 2pt; }
</style></head><body>`;

    // Cover
    html += `<div class="cover">
<p style="font-family:'HK Guise',Calibri;font-size:20pt;color:#F94816;font-weight:bold;">STM <span style="color:#22293B;font-weight:300;font-size:14pt;">GROUP</span></p>
<p class="cover-title">Request for Quotation</p>
<p style="font-size:12pt;color:#314056;margin-top:6pt;">${catInfo?.scope || ''}</p>
<br/>
<table class="cover-table">
<tr><td>Company:</td><td>${companyName}</td></tr>
<tr><td>Supplier:</td><td>${supplierName || '(to be filled)'}</td></tr>
<tr><td>Project:</td><td>${projectName || '(to be filled)'}</td></tr>
<tr><td>Project no.:</td><td>${projectNumber || '(to be filled)'}</td></tr>
<tr><td>Date:</td><td>${new Date().toLocaleDateString('nl-NL')}</td></tr>
<tr><td>Scope:</td><td>${catInfo?.scope || ''}</td></tr>
</table></div>`;

    // Chapters
    for (const ch of state.chapters) {
      const activeBlocks = ch.blocks.filter(b => state.selected.has(b.id));
      if (!activeBlocks.length) continue;

      html += `<h1>${ch.number}. ${ch.title}</h1>`;

      for (const bl of activeBlocks) {
        if (state.delBlocks.has(bl.id)) {
          html += `<p class="delegated">To be specified by the Supplier.</p>`;
          continue;
        }

        let text = bl.text || '';
        // Replace variables
        text = text.replace(/\{\{([^}]+)\}\}/g, (match, varId) => {
          if (state.removedVars[bl.id]?.[varId]) return '';
          if (state.supVars[bl.id]?.[varId]) {
            const vd = bl.variables?.find(v => v.id === varId);
            return `<span class="delegated">[${vd?.delegateText || 'By Supplier'}]</span>`;
          }
          const val = state.vals[bl.id]?.[varId];
          const vd = bl.variables?.find(v => v.id === varId);
          return val || vd?.default || varId;
        });

        // Convert line breaks and bullets
        const lines = text.split('\n').map(line => {
          if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
          if (/^\d+\.\s/.test(line)) return `<li>${line}</li>`;
          if (line === '') return '<br/>';
          return `<p>${line}</p>`;
        });

        // Group consecutive <li> into <ul>
        let inList = false;
        const processed = [];
        for (const l of lines) {
          if (l.startsWith('<li>')) {
            if (!inList) { processed.push('<ul>'); inList = true; }
            processed.push(l);
          } else {
            if (inList) { processed.push('</ul>'); inList = false; }
            processed.push(l);
          }
        }
        if (inList) processed.push('</ul>');

        html += processed.join('\n');

        // Alt var requests
        const altRequests = (bl.variables || []).filter(v =>
          state.altVars[bl.id]?.[v.id] && !state.removedVars[bl.id]?.[v.id]
        );
        if (altRequests.length > 0) {
          html += `<div class="alt-section"><p><strong>Requested alternatives:</strong></p><ul>`;
          for (const v of altRequests) {
            html += `<li>${v.altText || `Alternative for ${v.label}`}</li>`;
          }
          html += `</ul></div>`;
        }

        if (state.altProduct[bl.id]) {
          html += `<div class="alt-section"><p><strong>Alternative product requested.</strong> The Supplier shall quote an alternative product separately with full technical details.</p></div>`;
        }
      }
    }

    // Closing
    const stmContact = state.vals?.b1_intro?.stmContact || '';
    html += `<br/><p>Kind regards,</p><p>${stmContact || companyName}</p>`;
    html += `</body></html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const pg = catInfo?.pg || 'PG00';
    a.download = `RFQ_${projectNumber || 'DRAFT'}_${pg}_${categoryId}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state, categoryId]);

  if (!state) return <div>Loading...</div>;

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: 13,
        color: C.txt,
        background: C.lt,
        userSelect: drag ? 'none' : 'auto',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <TopBar
        categoryId={categoryId}
        onCategoryChange={handleCategoryChange}
        onReset={handleReset}
        onSave={handleSave}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onExportWord={handleExportWord}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        frozen={state.frozen}
        onToggleFreeze={handleToggleFreeze}
        saved={saved}
        onOpenMaster={() => setShowMaster(true)}
      />
      {showMaster && <MasterEditor onClose={() => setShowMaster(false)} />}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{
          width: cols.l,
          borderRight: `1px solid ${C.bor}`,
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <LeftPanel
            chapters={state.chapters}
            selected={state.selected}
            activeBlock={state.activeBlock}
            editedTexts={state.editedTexts}
            delBlocks={state.delBlocks}
            altProduct={state.altProduct}
            onToggleBlock={tracked(toggleBlock)}
            onSelectBlock={setActiveBlock}
            frozen={state.frozen}
          />
        </div>

        {/* Left divider */}
        <div
          onMouseDown={e => onMouseDown('l', e)}
          style={{
            width: 5,
            cursor: 'col-resize',
            background: drag === 'l' ? C.o : 'transparent',
            flexShrink: 0,
            transition: 'background .15s',
          }}
        />

        {/* Middle panel */}
        <MiddlePanel
          chapters={state.chapters}
          activeBlock={state.activeBlock}
          selected={state.selected}
          vals={state.vals}
          supVars={state.supVars}
          delBlocks={state.delBlocks}
          removedVars={state.removedVars}
          altVars={state.altVars}
          altProduct={state.altProduct}
          editedTexts={state.editedTexts}
          specOrder={state.specOrder}
          customSpecs={state.customSpecs}
          frozen={state.frozen}
          onSetVal={tracked(setVal)}
          onToggleDelegate={tracked(toggleDelegate)}
          onToggleDelegateBlock={tracked(toggleDelegateBlock)}
          onToggleAltVar={tracked(toggleAltVar)}
          onToggleAltProduct={tracked(toggleAltProduct)}
          onRemoveVar={tracked(removeVar)}
          onRestoreVar={tracked(restoreVar)}
          onRestoreAllVars={tracked(restoreAllVars)}
          onUpdateText={tracked(updateText)}
          onSetSpecOrder={tracked(setSpecOrder)}
          onAddCustomSpec={tracked(addCustomSpec)}
        />

        {/* Right divider */}
        <div
          onMouseDown={e => onMouseDown('r', e)}
          style={{
            width: 5,
            cursor: 'col-resize',
            background: drag === 'r' ? C.o : 'transparent',
            flexShrink: 0,
            transition: 'background .15s',
          }}
        />

        {/* Right panel */}
        <div style={{
          width: cols.r,
          borderLeft: `1px solid ${C.bor}`,
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <RFQPreview
            chapters={state.chapters}
            selected={state.selected}
            vals={state.vals}
            supVars={state.supVars}
            delBlocks={state.delBlocks}
            removedVars={state.removedVars}
            altVars={state.altVars}
            altProduct={state.altProduct}
            editedTexts={state.editedTexts}
            getOriginalText={getOriginalText}
          />
        </div>
      </div>
    </div>
  );
}
