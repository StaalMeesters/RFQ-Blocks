import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { CATEGORY_DATA, CATEGORY_LIST, DEFAULT_CHAPTER_ORDER } from '../data/categoryRegistry.js';
import { mergeMultiProductChapters, orderChapters, buildBlockProductMap, findBlockInChapters } from '../utils/mergeChapters.js';
import { loadMultiState, saveMultiState } from '../utils/storage.js';

const MAX_UNDO = 50;

/** Default state for a single product */
function createProductState() {
  return {
    vals: {},
    removedVars: [],    // Set serialized as array
    altVars: [],        // Set serialized as array
    altProduct: false,
    customSpecs: [],
  };
}

export default function useMultiProductData(entityId, initialCategoryIds) {
  // initialCategoryIds: string[] of category IDs from the selector

  // Products: [{categoryId, label}]
  const [products, setProducts] = useState([]);

  // Per-product state: { [categoryId]: ProductState }
  const [productStates, setProductStates] = useState({});

  // Global state (block IDs are unique across categories)
  const [selectedBlocks, setSelectedBlocks] = useState(new Set());
  const [editedTexts, setEditedTexts] = useState({});
  const [delBlocks, setDelBlocks] = useState(new Set());

  // Shared vals (for variables in shared chapters like inleiding, levering, etc.)
  const [sharedVals, setSharedVals] = useState({});

  // Config
  const [chapterOrder, setChapterOrder] = useState(DEFAULT_CHAPTER_ORDER);
  const [montageEnabled, setMontageEnabled] = useState(false);
  const [bimEnabled, setBimEnabled] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('draft');
  const [contractType, setContractType] = useState({ design: false, supply: true, build: false });

  // UI
  const [activeBlock, setActiveBlock] = useState(null);
  const [activeProductIndex, setActiveProductIndex] = useState(0);

  // Undo/redo
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const undoTimer = useRef(null);

  // Save indicator timestamp
  const [lastSaved, setLastSaved] = useState(null);

  // Build product data for merging
  const productMergeData = useMemo(() => {
    return products.map(p => ({
      catJson: CATEGORY_DATA[p.categoryId],
      categoryId: p.categoryId,
      label: p.label,
    })).filter(p => p.catJson);
  }, [products]);

  // Build chapters
  const chapterMap = useMemo(() => {
    if (productMergeData.length === 0) return {};
    return mergeMultiProductChapters(productMergeData, entityId, { montageEnabled, bimEnabled, contractType });
  }, [productMergeData, entityId, montageEnabled, bimEnabled, contractType]);

  const chapters = useMemo(
    () => orderChapters(chapterMap, chapterOrder),
    [chapterMap, chapterOrder]
  );

  // Block → product index mapping
  const blockProductMap = useMemo(
    () => buildBlockProductMap(chapters),
    [chapters]
  );

  // Category metas
  const catMetas = useMemo(
    () => products.map(p => CATEGORY_DATA[p.categoryId]?._meta).filter(Boolean),
    [products]
  );

  // ── Initialize from saved state or from initialCategoryIds ──

  useEffect(() => {
    if (!entityId || !initialCategoryIds || initialCategoryIds.length === 0) return;

    const saved = loadMultiState(entityId);
    if (saved && saved.products && saved.products.length > 0) {
      // Restore from saved state
      setProducts(saved.products);
      setProductStates(saved.productStates || {});
      setSelectedBlocks(new Set(saved.selectedBlocks || []));
      setEditedTexts(saved.editedTexts || {});
      setDelBlocks(new Set(saved.delBlocks || []));
      setSharedVals(saved.sharedVals || {});
      setChapterOrder(saved.chapterOrder || DEFAULT_CHAPTER_ORDER);
      setMontageEnabled(saved.montageEnabled ?? false);
      setBimEnabled(saved.bimEnabled ?? false);
      setContractType(saved.contractType || { design: false, supply: true, build: false });
      setFrozen(saved.frozen || false);
      setReviewStatus(saved.reviewStatus || 'draft');
    } else {
      // Initialize fresh from category IDs
      const newProducts = initialCategoryIds.map(catId => {
        const catInfo = CATEGORY_LIST.find(c => c.id === catId);
        return { categoryId: catId, label: catInfo?.scope || catId };
      });
      setProducts(newProducts);

      // Build product states
      const newStates = {};
      for (const catId of initialCategoryIds) {
        newStates[catId] = createProductState();
      }
      setProductStates(newStates);

      // Set default selected blocks
      const tempMerge = mergeMultiProductChapters(
        newProducts.map(p => ({
          catJson: CATEGORY_DATA[p.categoryId],
          categoryId: p.categoryId,
          label: p.label,
        })).filter(p => p.catJson),
        entityId,
        { montageEnabled: false, bimEnabled: false }
      );
      const defaultSelected = new Set();
      for (const ch of Object.values(tempMerge)) {
        if (ch.blocks) {
          for (const b of ch.blocks) { if (b.defaultOn) defaultSelected.add(b.id); }
        }
        if (ch.productSections) {
          for (const sec of ch.productSections) {
            for (const b of sec.blocks) { if (b.defaultOn) defaultSelected.add(b.id); }
          }
        }
      }
      setSelectedBlocks(defaultSelected);
      setEditedTexts({});
      setDelBlocks(new Set());
      setSharedVals({});
      setChapterOrder(DEFAULT_CHAPTER_ORDER);

      // Default montage/bim: on if any product defaults it
      const anyMontage = newProducts.some(p => {
        const ci = CATEGORY_LIST.find(c => c.id === p.categoryId);
        return ci?.defaultMontage;
      });
      const anyBim = newProducts.some(p => {
        const ci = CATEGORY_LIST.find(c => c.id === p.categoryId);
        return ci?.defaultBIM;
      });
      setMontageEnabled(anyMontage);
      setBimEnabled(anyBim);
      setFrozen(false);
      setReviewStatus('draft');
    }

    setActiveBlock(null);
    setActiveProductIndex(0);
    setUndoStack([]);
    setRedoStack([]);
  }, [entityId, initialCategoryIds]);

  // ── Determine active context based on active block ──

  const activeBlockContext = useMemo(() => {
    if (!activeBlock) return null;
    return findBlockInChapters(chapters, activeBlock);
  }, [chapters, activeBlock]);

  // Which product's state to use for the active block
  const activeContextProductIndex = activeBlockContext?.productIndex;
  const activeContextCategoryId = activeContextProductIndex !== undefined
    ? products[activeContextProductIndex]?.categoryId
    : undefined;

  // Current vals/state based on active context
  const currentVals = activeContextCategoryId
    ? (productStates[activeContextCategoryId]?.vals || {})
    : sharedVals;

  const currentRemovedVars = useMemo(() => {
    if (!activeContextCategoryId) return new Set();
    return new Set(productStates[activeContextCategoryId]?.removedVars || []);
  }, [activeContextCategoryId, productStates]);

  const currentAltVars = useMemo(() => {
    if (!activeContextCategoryId) return new Set();
    return new Set(productStates[activeContextCategoryId]?.altVars || []);
  }, [activeContextCategoryId, productStates]);

  const currentAltProduct = activeContextCategoryId
    ? (productStates[activeContextCategoryId]?.altProduct || false)
    : false;

  const currentCustomSpecs = activeContextCategoryId
    ? (productStates[activeContextCategoryId]?.customSpecs || [])
    : [];

  // ── Undo/Redo ──

  function takeSnapshot() {
    return {
      productStates: JSON.parse(JSON.stringify(productStates)),
      selectedBlocks: [...selectedBlocks],
      editedTexts: { ...editedTexts },
      delBlocks: [...delBlocks],
      sharedVals: { ...sharedVals },
      chapterOrder: [...chapterOrder],
      montageEnabled,
      bimEnabled,
      contractType: { ...contractType },
      products: JSON.parse(JSON.stringify(products)),
    };
  }

  function applySnapshot(snap) {
    setProductStates(snap.productStates);
    setSelectedBlocks(new Set(snap.selectedBlocks));
    setEditedTexts(snap.editedTexts);
    setDelBlocks(new Set(snap.delBlocks));
    setSharedVals(snap.sharedVals);
    setChapterOrder(snap.chapterOrder);
    setMontageEnabled(snap.montageEnabled);
    setBimEnabled(snap.bimEnabled);
    if (snap.contractType) setContractType(snap.contractType);
    if (snap.products) setProducts(snap.products);
  }

  const pushUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => {
      const snap = takeSnapshot();
      setUndoStack(prev => [...prev.slice(-(MAX_UNDO - 1)), snap]);
      setRedoStack([]);
    }, 300);
  }, [productStates, selectedBlocks, editedTexts, delBlocks, sharedVals, chapterOrder, montageEnabled, bimEnabled, products]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, takeSnapshot()]);
    setUndoStack(s => s.slice(0, -1));
    applySnapshot(prev);
  }, [undoStack, productStates, selectedBlocks, editedTexts, delBlocks, sharedVals, chapterOrder, montageEnabled, bimEnabled, products]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, takeSnapshot()]);
    setRedoStack(r => r.slice(0, -1));
    applySnapshot(next);
  }, [redoStack, productStates, selectedBlocks, editedTexts, delBlocks, sharedVals, chapterOrder, montageEnabled, bimEnabled, products]);

  // ── Actions ──

  const setVal = useCallback((varId, value) => {
    pushUndo();
    if (activeContextCategoryId) {
      // Product-specific val
      setProductStates(prev => ({
        ...prev,
        [activeContextCategoryId]: {
          ...prev[activeContextCategoryId],
          vals: { ...(prev[activeContextCategoryId]?.vals || {}), [varId]: value },
        },
      }));
    } else {
      // Shared val
      setSharedVals(prev => ({ ...prev, [varId]: value }));
    }
  }, [pushUndo, activeContextCategoryId]);

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
    if (frozen || !activeContextCategoryId) return;
    pushUndo();
    setProductStates(prev => {
      const catState = prev[activeContextCategoryId] || createProductState();
      const altSet = new Set(catState.altVars);
      if (altSet.has(varId)) altSet.delete(varId);
      else altSet.add(varId);
      return {
        ...prev,
        [activeContextCategoryId]: { ...catState, altVars: [...altSet] },
      };
    });
  }, [frozen, pushUndo, activeContextCategoryId]);

  const toggleAltProduct = useCallback(() => {
    if (frozen || !activeContextCategoryId) return;
    pushUndo();
    setProductStates(prev => {
      const catState = prev[activeContextCategoryId] || createProductState();
      return {
        ...prev,
        [activeContextCategoryId]: { ...catState, altProduct: !catState.altProduct },
      };
    });
  }, [frozen, pushUndo, activeContextCategoryId]);

  const removeVar = useCallback((varId) => {
    if (frozen || !activeContextCategoryId) return;
    pushUndo();
    setProductStates(prev => {
      const catState = prev[activeContextCategoryId] || createProductState();
      return {
        ...prev,
        [activeContextCategoryId]: {
          ...catState,
          removedVars: [...new Set([...catState.removedVars, varId])],
        },
      };
    });
  }, [frozen, pushUndo, activeContextCategoryId]);

  const restoreVar = useCallback((varId) => {
    if (!activeContextCategoryId) return;
    pushUndo();
    setProductStates(prev => {
      const catState = prev[activeContextCategoryId] || createProductState();
      return {
        ...prev,
        [activeContextCategoryId]: {
          ...catState,
          removedVars: catState.removedVars.filter(v => v !== varId),
        },
      };
    });
  }, [pushUndo, activeContextCategoryId]);

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
    if (frozen || !activeContextCategoryId) return;
    pushUndo();
    setProductStates(prev => {
      const catState = prev[activeContextCategoryId] || createProductState();
      return {
        ...prev,
        [activeContextCategoryId]: {
          ...catState,
          customSpecs: [...catState.customSpecs, { ...spec, id: `custom_${Date.now()}` }],
        },
      };
    });
  }, [frozen, pushUndo, activeContextCategoryId]);

  const toggleFreeze = useCallback(() => setFrozen(prev => !prev), []);
  const setReview = useCallback((status) => setReviewStatus(status), []);

  const updateContractType = useCallback((key, value) => {
    if (frozen) return;
    pushUndo();
    setContractType(prev => {
      const next = { ...prev, [key]: value };
      // Auto-enable montage when Build is selected
      if (key === 'build' && value) {
        setMontageEnabled(true);
      }
      return next;
    });
  }, [frozen, pushUndo]);

  // ── Product management ──

  const addProduct = useCallback((categoryId) => {
    const catInfo = CATEGORY_LIST.find(c => c.id === categoryId);
    if (!catInfo) return;
    if (products.some(p => p.categoryId === categoryId)) return; // no duplicates
    pushUndo();
    setProducts(prev => [...prev, { categoryId, label: catInfo.scope }]);
    setProductStates(prev => ({
      ...prev,
      [categoryId]: createProductState(),
    }));
  }, [products, pushUndo]);

  const removeProduct = useCallback((index) => {
    if (products.length <= 1) return; // must keep at least 1
    pushUndo();
    const removed = products[index];
    setProducts(prev => prev.filter((_, i) => i !== index));
    setProductStates(prev => {
      const next = { ...prev };
      delete next[removed.categoryId];
      return next;
    });
    // Clean up selected blocks / edited texts for removed product's blocks
    if (removed) {
      const catJson = CATEGORY_DATA[removed.categoryId];
      if (catJson) {
        const blockIds = new Set();
        for (const ch of Object.values(catJson.chapters || {})) {
          for (const b of (ch.blocks || [])) blockIds.add(b.id);
        }
        setSelectedBlocks(prev => {
          const next = new Set(prev);
          for (const id of blockIds) next.delete(id);
          return next;
        });
        setEditedTexts(prev => {
          const next = { ...prev };
          for (const id of blockIds) delete next[id];
          return next;
        });
        setDelBlocks(prev => {
          const next = new Set(prev);
          for (const id of blockIds) next.delete(id);
          return next;
        });
      }
    }
    if (activeProductIndex >= products.length - 1) {
      setActiveProductIndex(Math.max(0, products.length - 2));
    }
  }, [products, activeProductIndex, pushUndo]);

  // ── Save ──

  const save = useCallback(() => {
    if (!entityId || products.length === 0) return;
    saveMultiState(entityId, {
      products,
      productStates,
      selectedBlocks: [...selectedBlocks],
      editedTexts,
      delBlocks: [...delBlocks],
      sharedVals,
      chapterOrder,
      montageEnabled,
      bimEnabled,
      contractType,
      frozen,
      reviewStatus,
    });
  }, [entityId, products, productStates, selectedBlocks, editedTexts, delBlocks, sharedVals, chapterOrder, montageEnabled, bimEnabled, contractType, frozen, reviewStatus]);

  // Auto-save (debounced 2s)
  useEffect(() => {
    if (!entityId || products.length === 0) return;
    const t = setTimeout(() => {
      save();
      setLastSaved(Date.now());
    }, 2000);
    return () => clearTimeout(t);
  }, [products, productStates, selectedBlocks, editedTexts, delBlocks, sharedVals, chapterOrder, montageEnabled, bimEnabled, contractType, frozen, reviewStatus]);

  // ── Original text lookup ──

  const getOriginalText = useCallback((blockId) => {
    for (const ch of Object.values(chapterMap)) {
      if (ch.blocks) {
        for (const b of ch.blocks) { if (b.id === blockId) return b.text; }
      }
      if (ch.productSections) {
        for (const sec of ch.productSections) {
          for (const b of sec.blocks) { if (b.id === blockId) return b.text; }
        }
      }
    }
    return '';
  }, [chapterMap]);

  // ── Reset ──

  const resetAll = useCallback(() => {
    const newStates = {};
    for (const p of products) {
      newStates[p.categoryId] = createProductState();
    }
    setProductStates(newStates);
    // Rebuild default selections
    const defaultSelected = new Set();
    for (const ch of Object.values(chapterMap)) {
      if (ch.blocks) {
        for (const b of ch.blocks) { if (b.defaultOn) defaultSelected.add(b.id); }
      }
      if (ch.productSections) {
        for (const sec of ch.productSections) {
          for (const b of sec.blocks) { if (b.defaultOn) defaultSelected.add(b.id); }
        }
      }
    }
    setSelectedBlocks(defaultSelected);
    setEditedTexts({});
    setDelBlocks(new Set());
    setSharedVals({});
    setChapterOrder(DEFAULT_CHAPTER_ORDER);
    setUndoStack([]);
    setRedoStack([]);
  }, [products, chapterMap]);

  // ── Export JSON ──

  const exportJSON = useCallback(() => {
    return {
      entityId,
      products: products.map(p => ({
        categoryId: p.categoryId,
        label: p.label,
        state: productStates[p.categoryId] || createProductState(),
      })),
      sharedVals,
      selectedBlocks: [...selectedBlocks],
      editedTexts,
      delBlocks: [...delBlocks],
      chapterOrder,
      montageEnabled,
      bimEnabled,
      contractType,
      frozen,
      reviewStatus,
      exportDate: new Date().toISOString(),
    };
  }, [entityId, products, productStates, sharedVals, selectedBlocks, editedTexts, delBlocks, chapterOrder, montageEnabled, bimEnabled, frozen, reviewStatus]);

  // ── Import JSON ──

  const importState = useCallback((data) => {
    if (data.products) {
      setProducts(data.products.map(p => ({ categoryId: p.categoryId, label: p.label })));
      const states = {};
      for (const p of data.products) {
        states[p.categoryId] = p.state || createProductState();
      }
      setProductStates(states);
    }
    if (data.sharedVals) setSharedVals(data.sharedVals);
    if (data.selectedBlocks) setSelectedBlocks(new Set(data.selectedBlocks));
    if (data.editedTexts) setEditedTexts(data.editedTexts);
    if (data.delBlocks) setDelBlocks(new Set(data.delBlocks));
    if (data.chapterOrder) setChapterOrder(data.chapterOrder);
    if (data.montageEnabled !== undefined) setMontageEnabled(data.montageEnabled);
    if (data.bimEnabled !== undefined) setBimEnabled(data.bimEnabled);
    if (data.contractType) setContractType(data.contractType);
    if (data.frozen !== undefined) setFrozen(data.frozen);
    if (data.reviewStatus) setReviewStatus(data.reviewStatus);
  }, []);

  // ── Get vals for a specific product (used by preview/export) ──

  const getValsForProduct = useCallback((productIndex) => {
    const catId = products[productIndex]?.categoryId;
    return catId ? (productStates[catId]?.vals || {}) : {};
  }, [products, productStates]);

  const getRemovedVarsForProduct = useCallback((productIndex) => {
    const catId = products[productIndex]?.categoryId;
    return catId ? new Set(productStates[catId]?.removedVars || []) : new Set();
  }, [products, productStates]);

  const getAltVarsForProduct = useCallback((productIndex) => {
    const catId = products[productIndex]?.categoryId;
    return catId ? new Set(productStates[catId]?.altVars || []) : new Set();
  }, [products, productStates]);

  const getAltProductForProduct = useCallback((productIndex) => {
    const catId = products[productIndex]?.categoryId;
    return catId ? (productStates[catId]?.altProduct || false) : false;
  }, [products, productStates]);

  // ── Load preset into a specific product ──

  const loadPresetIntoProduct = useCallback((categoryId, presetVals) => {
    pushUndo();
    setProductStates(prev => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || createProductState()),
        vals: { ...(prev[categoryId]?.vals || {}), ...presetVals },
      },
    }));
  }, [pushUndo]);

  return {
    // Products
    products,
    activeProductIndex,
    setActiveProductIndex,
    addProduct,
    removeProduct,

    // Chapters
    chapters,
    chapterMap,
    blockProductMap,

    // Active block context
    activeBlock,
    setActiveBlock: setActiveBlock,
    activeBlockContext,

    // Current context values (auto-switches between shared/product)
    currentVals,
    currentRemovedVars,
    currentAltVars,
    currentAltProduct,
    currentCustomSpecs,

    // Global state
    selectedBlocks,
    editedTexts,
    delBlocks,
    sharedVals,

    // Config
    chapterOrder,
    montageEnabled,
    bimEnabled,
    contractType,
    frozen,
    reviewStatus,

    // Undo/redo
    undoStack,
    redoStack,
    undo,
    redo,

    // Actions
    setVal,
    toggleBlock,
    toggleDelegate,
    toggleAltVar,
    toggleAltProduct,
    removeVar,
    restoreVar,
    updateText,
    updateChapterOrder,
    toggleMontage,
    toggleBim,
    addCustomSpec,
    toggleFreeze,
    setReview,
    updateContractType,

    // Operations
    save,
    getOriginalText,
    resetAll,
    exportJSON,
    importState,

    // Product-specific lookups (for preview/export)
    getValsForProduct,
    getRemovedVarsForProduct,
    getAltVarsForProduct,
    getAltProductForProduct,
    loadPresetIntoProduct,

    // Metadata
    catMetas,
    entityId,
    lastSaved,
  };
}
