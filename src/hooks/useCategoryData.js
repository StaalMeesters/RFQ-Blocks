import { useState, useCallback, useRef, useEffect } from 'react';
import { CATEGORY_DATA, CATEGORY_LIST, DEFAULT_CHAPTER_ORDER } from '../data/categoryRegistry.js';
import { mergeChapters, orderChapters } from '../utils/mergeChapters.js';
import { loadState, saveState } from '../utils/storage.js';

const MAX_UNDO = 50;

export default function useCategoryData(entityId, categoryId) {
  const catJson = CATEGORY_DATA[categoryId];
  const catMeta = catJson?._meta;
  const catInfo = CATEGORY_LIST.find(c => c.id === categoryId);

  // Core state
  const [vals, setVals] = useState({});
  const [selectedBlocks, setSelectedBlocks] = useState(new Set());
  const [activeBlock, setActiveBlock] = useState(null);
  const [editedTexts, setEditedTexts] = useState({});
  const [delBlocks, setDelBlocks] = useState(new Set());
  const [removedVars, setRemovedVars] = useState(new Set());
  const [altVars, setAltVars] = useState(new Set());
  const [altProduct, setAltProduct] = useState(false);
  const [chapterOrder, setChapterOrder] = useState(DEFAULT_CHAPTER_ORDER);
  const [montageEnabled, setMontageEnabled] = useState(catInfo?.defaultMontage ?? false);
  const [bimEnabled, setBimEnabled] = useState(catInfo?.defaultBIM ?? false);
  const [frozen, setFrozen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('draft');
  const [customSpecs, setCustomSpecs] = useState([]);

  // Undo/redo
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const undoTimer = useRef(null);

  // Build chapters
  const chapterMap = catJson ? mergeChapters(catJson, entityId, { montageEnabled, bimEnabled }) : {};
  const chapters = orderChapters(chapterMap, chapterOrder);

  // Initialize from saved state or defaults
  useEffect(() => {
    if (!categoryId || !entityId) return;
    const saved = loadState(entityId, categoryId);
    if (saved) {
      setVals(saved.vals || {});
      setSelectedBlocks(new Set(saved.selectedBlocks || []));
      setEditedTexts(saved.editedTexts || {});
      setDelBlocks(new Set(saved.delBlocks || []));
      setRemovedVars(new Set(saved.removedVars || []));
      setAltVars(new Set(saved.altVars || []));
      setAltProduct(saved.altProduct || false);
      setChapterOrder(saved.chapterOrder || DEFAULT_CHAPTER_ORDER);
      setMontageEnabled(saved.montageEnabled ?? catInfo?.defaultMontage ?? false);
      setBimEnabled(saved.bimEnabled ?? catInfo?.defaultBIM ?? false);
      setFrozen(saved.frozen || false);
      setReviewStatus(saved.reviewStatus || 'draft');
      setCustomSpecs(saved.customSpecs || []);
      setActiveBlock(null);
      setUndoStack([]);
      setRedoStack([]);
    } else {
      // Defaults
      const defaultSelected = new Set();
      for (const ch of Object.values(chapterMap)) {
        if (ch.blocks) {
          for (const b of ch.blocks) {
            if (b.defaultOn) defaultSelected.add(b.id);
          }
        }
      }
      setVals({});
      setSelectedBlocks(defaultSelected);
      setEditedTexts({});
      setDelBlocks(new Set());
      setRemovedVars(new Set());
      setAltVars(new Set());
      setAltProduct(false);
      setChapterOrder(DEFAULT_CHAPTER_ORDER);
      setMontageEnabled(catInfo?.defaultMontage ?? false);
      setBimEnabled(catInfo?.defaultBIM ?? false);
      setFrozen(false);
      setReviewStatus('draft');
      setCustomSpecs([]);
      setActiveBlock(null);
      setUndoStack([]);
      setRedoStack([]);
    }
  }, [entityId, categoryId]);

  // Push undo snapshot (debounced)
  const pushUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => {
      const snap = {
        vals: { ...vals },
        selectedBlocks: [...selectedBlocks],
        editedTexts: { ...editedTexts },
        delBlocks: [...delBlocks],
        removedVars: [...removedVars],
        altVars: [...altVars],
        altProduct,
        chapterOrder: [...chapterOrder],
        montageEnabled,
        bimEnabled,
        customSpecs: [...customSpecs],
      };
      setUndoStack(prev => [...prev.slice(-(MAX_UNDO - 1)), snap]);
      setRedoStack([]);
    }, 300);
  }, [vals, selectedBlocks, editedTexts, delBlocks, removedVars, altVars, altProduct, chapterOrder, montageEnabled, bimEnabled, customSpecs]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    // Save current to redo
    setRedoStack(r => [...r, {
      vals: { ...vals }, selectedBlocks: [...selectedBlocks], editedTexts: { ...editedTexts },
      delBlocks: [...delBlocks], removedVars: [...removedVars], altVars: [...altVars],
      altProduct, chapterOrder: [...chapterOrder], montageEnabled, bimEnabled, customSpecs: [...customSpecs],
    }]);
    setUndoStack(s => s.slice(0, -1));
    applySnapshot(prev);
  }, [undoStack, vals, selectedBlocks, editedTexts, delBlocks, removedVars, altVars, altProduct, chapterOrder, montageEnabled, bimEnabled, customSpecs]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, {
      vals: { ...vals }, selectedBlocks: [...selectedBlocks], editedTexts: { ...editedTexts },
      delBlocks: [...delBlocks], removedVars: [...removedVars], altVars: [...altVars],
      altProduct, chapterOrder: [...chapterOrder], montageEnabled, bimEnabled, customSpecs: [...customSpecs],
    }]);
    setRedoStack(r => r.slice(0, -1));
    applySnapshot(next);
  }, [redoStack, vals, selectedBlocks, editedTexts, delBlocks, removedVars, altVars, altProduct, chapterOrder, montageEnabled, bimEnabled, customSpecs]);

  function applySnapshot(snap) {
    setVals(snap.vals);
    setSelectedBlocks(new Set(snap.selectedBlocks));
    setEditedTexts(snap.editedTexts);
    setDelBlocks(new Set(snap.delBlocks));
    setRemovedVars(new Set(snap.removedVars));
    setAltVars(new Set(snap.altVars));
    setAltProduct(snap.altProduct);
    setChapterOrder(snap.chapterOrder);
    setMontageEnabled(snap.montageEnabled);
    setBimEnabled(snap.bimEnabled);
    setCustomSpecs(snap.customSpecs);
  }

  // Actions
  const setVal = useCallback((varId, value) => {
    pushUndo();
    setVals(prev => ({ ...prev, [varId]: value }));
  }, [pushUndo]);

  const toggleBlock = useCallback((blockId) => {
    if (frozen) return;
    pushUndo();
    setSelectedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }, [frozen, pushUndo]);

  const toggleDelegate = useCallback((blockId) => {
    if (frozen) return;
    pushUndo();
    setDelBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }, [frozen, pushUndo]);

  const toggleAltVar = useCallback((varId) => {
    if (frozen) return;
    pushUndo();
    setAltVars(prev => {
      const next = new Set(prev);
      if (next.has(varId)) next.delete(varId);
      else next.add(varId);
      return next;
    });
  }, [frozen, pushUndo]);

  const toggleAltProduct = useCallback(() => {
    if (frozen) return;
    pushUndo();
    setAltProduct(prev => !prev);
  }, [frozen, pushUndo]);

  const removeVar = useCallback((varId) => {
    if (frozen) return;
    pushUndo();
    setRemovedVars(prev => new Set([...prev, varId]));
  }, [frozen, pushUndo]);

  const restoreVar = useCallback((varId) => {
    pushUndo();
    setRemovedVars(prev => {
      const next = new Set(prev);
      next.delete(varId);
      return next;
    });
  }, [pushUndo]);

  const updateText = useCallback((blockId, text) => {
    if (frozen) return;
    pushUndo();
    setEditedTexts(prev => ({ ...prev, [blockId]: text }));
  }, [frozen, pushUndo]);

  const updateChapterOrder = useCallback((newOrder) => {
    if (frozen) return;
    pushUndo();
    setChapterOrder(newOrder);
  }, [frozen, pushUndo]);

  const toggleMontage = useCallback(() => {
    if (frozen) return;
    pushUndo();
    setMontageEnabled(prev => !prev);
  }, [frozen, pushUndo]);

  const toggleBim = useCallback(() => {
    if (frozen) return;
    pushUndo();
    setBimEnabled(prev => !prev);
  }, [frozen, pushUndo]);

  const addCustomSpec = useCallback((spec) => {
    if (frozen) return;
    pushUndo();
    setCustomSpecs(prev => [...prev, { ...spec, id: `custom_${Date.now()}` }]);
  }, [frozen, pushUndo]);

  const toggleFreeze = useCallback(() => {
    setFrozen(prev => !prev);
  }, []);

  const setReview = useCallback((status) => {
    setReviewStatus(status);
  }, []);

  // Save
  const save = useCallback(() => {
    if (!entityId || !categoryId) return;
    saveState(entityId, categoryId, {
      vals,
      selectedBlocks: [...selectedBlocks],
      editedTexts,
      delBlocks: [...delBlocks],
      removedVars: [...removedVars],
      altVars: [...altVars],
      altProduct,
      chapterOrder,
      montageEnabled,
      bimEnabled,
      frozen,
      reviewStatus,
      customSpecs,
    });
  }, [entityId, categoryId, vals, selectedBlocks, editedTexts, delBlocks, removedVars, altVars, altProduct, chapterOrder, montageEnabled, bimEnabled, frozen, reviewStatus, customSpecs]);

  // Auto-save on changes
  useEffect(() => {
    if (!entityId || !categoryId) return;
    const t = setTimeout(save, 1000);
    return () => clearTimeout(t);
  }, [vals, selectedBlocks, editedTexts, delBlocks, removedVars, altVars, altProduct, chapterOrder, montageEnabled, bimEnabled, frozen, reviewStatus, customSpecs]);

  // Get original text for a block
  const getOriginalText = useCallback((blockId) => {
    for (const ch of Object.values(chapterMap)) {
      if (!ch.blocks) continue;
      for (const b of ch.blocks) {
        if (b.id === blockId) return b.text;
      }
    }
    return '';
  }, [chapterMap]);

  // Reset category
  const resetCategory = useCallback(() => {
    setVals({});
    const defaultSelected = new Set();
    for (const ch of Object.values(chapterMap)) {
      if (ch.blocks) {
        for (const b of ch.blocks) {
          if (b.defaultOn) defaultSelected.add(b.id);
        }
      }
    }
    setSelectedBlocks(defaultSelected);
    setEditedTexts({});
    setDelBlocks(new Set());
    setRemovedVars(new Set());
    setAltVars(new Set());
    setAltProduct(false);
    setChapterOrder(DEFAULT_CHAPTER_ORDER);
    setMontageEnabled(catInfo?.defaultMontage ?? false);
    setBimEnabled(catInfo?.defaultBIM ?? false);
    setCustomSpecs([]);
    setUndoStack([]);
    setRedoStack([]);
  }, [chapterMap]);

  // Export state as JSON
  const exportJSON = useCallback(() => {
    return {
      entityId,
      categoryId,
      scope: catMeta?.scope,
      exportDate: new Date().toISOString(),
      vals,
      selectedBlocks: [...selectedBlocks],
      editedTexts,
      delBlocks: [...delBlocks],
      removedVars: [...removedVars],
      altVars: [...altVars],
      altProduct,
      chapterOrder,
      montageEnabled,
      bimEnabled,
      frozen,
      reviewStatus,
      customSpecs,
    };
  }, [entityId, categoryId, catMeta, vals, selectedBlocks, editedTexts, delBlocks, removedVars, altVars, altProduct, chapterOrder, montageEnabled, bimEnabled, frozen, reviewStatus, customSpecs]);

  // Import state from JSON
  const importState = useCallback((data) => {
    if (data.vals) setVals(data.vals);
    if (data.selectedBlocks) setSelectedBlocks(new Set(data.selectedBlocks));
    if (data.editedTexts) setEditedTexts(data.editedTexts);
    if (data.delBlocks) setDelBlocks(new Set(data.delBlocks));
    if (data.removedVars) setRemovedVars(new Set(data.removedVars));
    if (data.altVars) setAltVars(new Set(data.altVars));
    if (data.altProduct !== undefined) setAltProduct(data.altProduct);
    if (data.chapterOrder) setChapterOrder(data.chapterOrder);
    if (data.montageEnabled !== undefined) setMontageEnabled(data.montageEnabled);
    if (data.bimEnabled !== undefined) setBimEnabled(data.bimEnabled);
    if (data.frozen !== undefined) setFrozen(data.frozen);
    if (data.reviewStatus) setReviewStatus(data.reviewStatus);
    if (data.customSpecs) setCustomSpecs(data.customSpecs);
  }, []);

  return {
    catJson, catMeta, catInfo,
    chapters, chapterMap,
    vals, selectedBlocks, activeBlock, editedTexts,
    delBlocks, removedVars, altVars, altProduct,
    chapterOrder, montageEnabled, bimEnabled,
    frozen, reviewStatus, customSpecs,
    undoStack, redoStack,
    // Actions
    setVal, toggleBlock, setActiveBlock,
    toggleDelegate, toggleAltVar, toggleAltProduct,
    removeVar, restoreVar, updateText,
    updateChapterOrder, toggleMontage, toggleBim,
    addCustomSpec, toggleFreeze, setReview,
    save, undo, redo,
    getOriginalText, resetCategory,
    exportJSON, importState,
  };
}
