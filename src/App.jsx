import { useState, useEffect, useCallback, useRef } from 'react';
import { C } from './utils/colors.js';
import { exportWord } from './utils/exportWord.js';
import useCategoryData from './hooks/useCategoryData.js';
import EntitySelector from './components/EntitySelector.jsx';
import TopBar from './components/TopBar.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import MiddlePanel from './components/MiddlePanel.jsx';
import RFQPreview from './components/RFQPreview.jsx';

export default function App() {
  const [screen, setScreen] = useState('select'); // 'select' or 'editor'
  const [entityId, setEntityId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Resizable panels
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(340);
  const dragging = useRef(null);

  const data = useCategoryData(entityId, categoryId);

  const handleStart = (eid, cid) => {
    setEntityId(eid);
    setCategoryId(cid);
    setScreen('editor');
  };

  const handleBack = () => {
    data.save();
    setScreen('select');
  };

  const handleCategoryChange = (newCatId) => {
    data.save();
    setCategoryId(newCatId);
  };

  const handleExportWord = () => {
    exportWord({
      chapters: data.chapters,
      selectedBlocks: data.selectedBlocks,
      vals: data.vals,
      editedTexts: data.editedTexts,
      delBlocks: data.delBlocks,
      removedVars: data.removedVars,
      altVars: data.altVars,
      altProduct: data.altProduct,
      entityId,
      categoryId,
      catMeta: data.catMeta,
    });
  };

  const handleReset = () => {
    if (confirm('Alle wijzigingen voor deze categorie herstellen naar standaard?')) {
      data.resetCategory();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (screen !== 'editor') return;
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); data.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); data.redo(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); data.save(); }
      if (e.ctrlKey && e.key === 'e') { e.preventDefault(); handleExportWord(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, data]);

  // Resize handlers
  const handleMouseDown = useCallback((panel) => (e) => {
    e.preventDefault();
    dragging.current = { panel, startX: e.clientX, startLeft: leftWidth, startRight: rightWidth };
    const handleMouseMove = (e) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragging.current.startX;
      if (dragging.current.panel === 'left') {
        setLeftWidth(Math.max(200, Math.min(400, dragging.current.startLeft + dx)));
      } else {
        setRightWidth(Math.max(250, Math.min(500, dragging.current.startRight - dx)));
      }
    };
    const handleMouseUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [leftWidth, rightWidth]);

  if (screen === 'select') {
    return <EntitySelector onStart={handleStart} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar
        entityId={entityId}
        categoryId={categoryId}
        onCategoryChange={handleCategoryChange}
        onBack={handleBack}
        onUndo={data.undo}
        onRedo={data.redo}
        canUndo={data.undoStack.length > 0}
        canRedo={data.redoStack.length > 0}
        onReset={handleReset}
        onExportJSON={data.exportJSON}
        onImportJSON={data.importState}
        onExportWord={handleExportWord}
        frozen={data.frozen}
        onToggleFreeze={data.toggleFreeze}
        reviewStatus={data.reviewStatus}
        onSetReview={data.setReview}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{
          width: leftWidth,
          minWidth: 200,
          borderRight: `1px solid ${C.bor}`,
          background: C.wh,
          overflow: 'hidden',
        }}>
          <LeftPanel
            chapters={data.chapters}
            selectedBlocks={data.selectedBlocks}
            activeBlock={data.activeBlock}
            delBlocks={data.delBlocks}
            frozen={data.frozen}
            onToggleBlock={data.toggleBlock}
            onSetActive={data.setActiveBlock}
            onToggleDelegate={data.toggleDelegate}
            chapterOrder={data.chapterOrder}
            onReorderChapters={data.updateChapterOrder}
            montageEnabled={data.montageEnabled}
            bimEnabled={data.bimEnabled}
            onToggleMontage={data.toggleMontage}
            onToggleBim={data.toggleBim}
          />
        </div>

        {/* Left resize handle */}
        <div
          onMouseDown={handleMouseDown('left')}
          style={{
            width: 4,
            cursor: 'col-resize',
            background: 'transparent',
            zIndex: 10,
          }}
          onMouseEnter={e => e.target.style.background = C.o}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        />

        {/* Middle panel */}
        <div style={{ flex: 1, overflow: 'hidden', background: C.lt }}>
          <MiddlePanel
            chapters={data.chapters}
            activeBlock={data.activeBlock}
            selectedBlocks={data.selectedBlocks}
            vals={data.vals}
            editedTexts={data.editedTexts}
            delBlocks={data.delBlocks}
            removedVars={data.removedVars}
            altVars={data.altVars}
            altProduct={data.altProduct}
            frozen={data.frozen}
            customSpecs={data.customSpecs}
            onSetVal={data.setVal}
            onToggleDelegate={data.toggleDelegate}
            onToggleAltVar={data.toggleAltVar}
            onToggleAltProduct={data.toggleAltProduct}
            onRemoveVar={data.removeVar}
            onRestoreVar={data.restoreVar}
            onUpdateText={data.updateText}
            onAddCustomSpec={data.addCustomSpec}
            getOriginalText={data.getOriginalText}
          />
        </div>

        {/* Right resize handle */}
        <div
          onMouseDown={handleMouseDown('right')}
          style={{
            width: 4,
            cursor: 'col-resize',
            background: 'transparent',
            zIndex: 10,
          }}
          onMouseEnter={e => e.target.style.background = C.o}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        />

        {/* Right panel — Preview */}
        <div style={{
          width: rightWidth,
          minWidth: 250,
          borderLeft: `1px solid ${C.bor}`,
          background: C.wh,
          overflow: 'hidden',
        }}>
          <RFQPreview
            chapters={data.chapters}
            selectedBlocks={data.selectedBlocks}
            vals={data.vals}
            editedTexts={data.editedTexts}
            delBlocks={data.delBlocks}
            removedVars={data.removedVars}
            altVars={data.altVars}
            altProduct={data.altProduct}
            getOriginalText={data.getOriginalText}
            entityId={entityId}
          />
        </div>
      </div>
    </div>
  );
}
