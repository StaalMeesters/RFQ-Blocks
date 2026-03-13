import { useState, useEffect, useCallback, useRef } from 'react';
import { C } from './utils/colors.js';
import { exportWord } from './utils/exportWord.js';
import useMultiProductData from './hooks/useMultiProductData.js';
import EntitySelector from './components/EntitySelector.jsx';
import TopBar from './components/TopBar.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import MiddlePanel from './components/MiddlePanel.jsx';
import RFQPreview from './components/RFQPreview.jsx';

export default function App() {
  const [screen, setScreen] = useState('select'); // 'select' or 'editor'
  const [entityId, setEntityId] = useState('');
  const [categoryIds, setCategoryIds] = useState([]); // multi-select

  // Resizable panels
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(340);
  const dragging = useRef(null);

  const data = useMultiProductData(entityId, categoryIds);

  // Save indicator (flashes after auto-save)
  const [saveFlash, setSaveFlash] = useState(false);
  const saveFlashTimer = useRef(null);
  useEffect(() => {
    if (screen !== 'editor' || !data.lastSaved) return;
    setSaveFlash(true);
    if (saveFlashTimer.current) clearTimeout(saveFlashTimer.current);
    saveFlashTimer.current = setTimeout(() => setSaveFlash(false), 2000);
  }, [data.lastSaved, screen]);

  const handleStart = (eid, catIds) => {
    setEntityId(eid);
    setCategoryIds(catIds);
    setScreen('editor');
  };

  const handleBack = () => {
    data.save();
    setScreen('select');
  };

  const handleExportWord = async () => {
    await exportWord({
      chapters: data.chapters,
      selectedBlocks: data.selectedBlocks,
      sharedVals: data.sharedVals,
      editedTexts: data.editedTexts,
      delBlocks: data.delBlocks,
      entityId,
      products: data.products,
      catMetas: data.catMetas,
      contractType: data.contractType,
      getValsForProduct: data.getValsForProduct,
      getRemovedVarsForProduct: data.getRemovedVarsForProduct,
      getAltVarsForProduct: data.getAltVarsForProduct,
      getAltProductForProduct: data.getAltProductForProduct,
    });
  };

  const handleReset = () => {
    if (confirm('Alle wijzigingen herstellen naar standaard?')) {
      data.resetAll();
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
        products={data.products}
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
        activeProductIndex={data.activeProductIndex}
        productStates={null} // presets use loadPresetIntoProduct directly
        onLoadPreset={data.loadPresetIntoProduct}
        getValsForProduct={data.getValsForProduct}
        contractType={data.contractType}
        onUpdateContractType={data.updateContractType}
        saveIndicator={saveFlash}
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
            products={data.products}
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
            onAddProduct={data.addProduct}
            onRemoveProduct={data.removeProduct}
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
            activeBlockContext={data.activeBlockContext}
            selectedBlocks={data.selectedBlocks}
            vals={data.currentVals}
            editedTexts={data.editedTexts}
            delBlocks={data.delBlocks}
            removedVars={data.currentRemovedVars}
            altVars={data.currentAltVars}
            altProduct={data.currentAltProduct}
            frozen={data.frozen}
            customSpecs={data.currentCustomSpecs}
            onSetVal={data.setVal}
            onToggleDelegate={data.toggleDelegate}
            onToggleAltVar={data.toggleAltVar}
            onToggleAltProduct={data.toggleAltProduct}
            onRemoveVar={data.removeVar}
            onRestoreVar={data.restoreVar}
            onUpdateText={data.updateText}
            onAddCustomSpec={data.addCustomSpec}
            getOriginalText={data.getOriginalText}
            isMultiProduct={data.products.length > 1}
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
            products={data.products}
            selectedBlocks={data.selectedBlocks}
            sharedVals={data.sharedVals}
            editedTexts={data.editedTexts}
            delBlocks={data.delBlocks}
            getOriginalText={data.getOriginalText}
            entityId={entityId}
            getValsForProduct={data.getValsForProduct}
            getRemovedVarsForProduct={data.getRemovedVarsForProduct}
            getAltVarsForProduct={data.getAltVarsForProduct}
            getAltProductForProduct={data.getAltProductForProduct}
          />
        </div>
      </div>
    </div>
  );
}
