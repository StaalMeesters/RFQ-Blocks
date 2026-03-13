import { useState, useCallback, useEffect, useRef } from 'react';
import { CATEGORY_DATA } from '../data/categoryRegistry';
import { mergeChapters } from '../utils/mergeChapters';
import { loadCategory, saveCategory, clearCategory } from '../utils/storage';

function getDefaultSelected(chapters) {
  const sel = new Set();
  for (const ch of chapters) {
    for (const bl of ch.blocks) {
      if (bl.defaultOn) sel.add(bl.id);
    }
  }
  return sel;
}

function initState(categoryId) {
  const catData = CATEGORY_DATA[categoryId];
  if (!catData) return null;
  const chapters = mergeChapters(catData);

  const saved = loadCategory(categoryId);
  if (saved) {
    return {
      categoryId,
      catData,
      chapters,
      selected: new Set(saved.selected || []),
      activeBlock: saved.activeBlock || chapters[0]?.blocks[0]?.id || '',
      vals: saved.vals || {},
      supVars: saved.supVars || {},
      delBlocks: new Set(saved.delBlocks || []),
      removedVars: saved.removedVars || {},
      altVars: saved.altVars || {},
      altProduct: saved.altProduct || {},
      editedTexts: saved.editedTexts || {},
      specOrder: saved.specOrder || {},
      customSpecs: saved.customSpecs || {},
      frozen: catData._meta?.frozen || false,
    };
  }

  return {
    categoryId,
    catData,
    chapters,
    selected: getDefaultSelected(chapters),
    activeBlock: chapters[0]?.blocks[0]?.id || '',
    vals: {},
    supVars: {},
    delBlocks: new Set(),
    removedVars: {},
    altVars: {},
    altProduct: {},
    editedTexts: {},
    specOrder: {},
    customSpecs: {},
    frozen: catData._meta?.frozen || false,
  };
}

export function useCategoryData(categoryId) {
  const [state, setState] = useState(() => initState(categoryId));
  const prevCatRef = useRef(categoryId);

  useEffect(() => {
    if (categoryId !== prevCatRef.current) {
      // Save previous category
      if (prevCatRef.current && state) {
        doSave(prevCatRef.current, state);
      }
      // Load new category
      setState(initState(categoryId));
      prevCatRef.current = categoryId;
    }
  }, [categoryId]);

  const doSave = useCallback((catId, s) => {
    saveCategory(catId || s.categoryId, {
      categoryId: catId || s.categoryId,
      selected: Array.from(s.selected),
      activeBlock: s.activeBlock,
      vals: s.vals,
      supVars: s.supVars,
      delBlocks: Array.from(s.delBlocks),
      removedVars: s.removedVars,
      altVars: s.altVars,
      altProduct: s.altProduct,
      editedTexts: s.editedTexts,
      specOrder: s.specOrder,
      customSpecs: s.customSpecs,
    });
  }, []);

  const save = useCallback(() => {
    if (state) doSave(state.categoryId, state);
  }, [state, doSave]);

  const setActiveBlock = useCallback((id) => {
    setState(s => ({ ...s, activeBlock: id }));
  }, []);

  const toggleBlock = useCallback((id) => {
    setState(s => {
      const n = new Set(s.selected);
      n.has(id) ? n.delete(id) : n.add(id);
      return { ...s, selected: n };
    });
  }, []);

  const setVal = useCallback((blockId, varId, value) => {
    setState(s => ({
      ...s,
      vals: { ...s.vals, [blockId]: { ...(s.vals[blockId] || {}), [varId]: value } },
    }));
  }, []);

  const toggleDelegate = useCallback((blockId, varId) => {
    setState(s => ({
      ...s,
      supVars: { ...s.supVars, [blockId]: { ...(s.supVars[blockId] || {}), [varId]: !(s.supVars[blockId]?.[varId]) } },
    }));
  }, []);

  const toggleDelegateBlock = useCallback((blockId) => {
    setState(s => {
      const n = new Set(s.delBlocks);
      n.has(blockId) ? n.delete(blockId) : n.add(blockId);
      return { ...s, delBlocks: n };
    });
  }, []);

  const toggleAltVar = useCallback((blockId, varId) => {
    setState(s => ({
      ...s,
      altVars: { ...s.altVars, [blockId]: { ...(s.altVars[blockId] || {}), [varId]: !(s.altVars[blockId]?.[varId]) } },
    }));
  }, []);

  const toggleAltProduct = useCallback((blockId) => {
    setState(s => ({ ...s, altProduct: { ...s.altProduct, [blockId]: !s.altProduct[blockId] } }));
  }, []);

  const removeVar = useCallback((blockId, varId) => {
    setState(s => ({
      ...s,
      removedVars: { ...s.removedVars, [blockId]: { ...(s.removedVars[blockId] || {}), [varId]: true } },
    }));
  }, []);

  const restoreVar = useCallback((blockId, varId) => {
    setState(s => {
      const n = { ...s.removedVars, [blockId]: { ...(s.removedVars[blockId] || {}) } };
      delete n[blockId][varId];
      return { ...s, removedVars: n };
    });
  }, []);

  const restoreAllVars = useCallback((blockId) => {
    setState(s => {
      const n = { ...s.removedVars };
      delete n[blockId];
      return { ...s, removedVars: n };
    });
  }, []);

  const updateText = useCallback((blockId, text) => {
    setState(s => {
      const chapters = JSON.parse(JSON.stringify(s.chapters));
      for (const ch of chapters) {
        const bl = ch.blocks.find(b => b.id === blockId);
        if (bl) { bl.text = text; break; }
      }
      return {
        ...s,
        chapters,
        editedTexts: { ...s.editedTexts, [blockId]: text },
      };
    });
  }, []);

  const resetCategory = useCallback(() => {
    clearCategory(categoryId);
    const catData = CATEGORY_DATA[categoryId];
    const chapters = mergeChapters(catData);
    setState({
      categoryId,
      catData,
      chapters,
      selected: getDefaultSelected(chapters),
      activeBlock: chapters[0]?.blocks[0]?.id || '',
      vals: {},
      supVars: {},
      delBlocks: new Set(),
      removedVars: {},
      altVars: {},
      altProduct: {},
      editedTexts: {},
      specOrder: {},
      customSpecs: {},
      frozen: catData._meta?.frozen || false,
    });
  }, [categoryId]);

  const setSpecOrder = useCallback((blockId, order) => {
    setState(s => ({
      ...s,
      specOrder: { ...s.specOrder, [blockId]: order },
    }));
  }, []);

  const addCustomSpec = useCallback((blockId, spec) => {
    setState(s => ({
      ...s,
      customSpecs: {
        ...s.customSpecs,
        [blockId]: [...(s.customSpecs[blockId] || []), spec],
      },
    }));
  }, []);

  const toggleFreeze = useCallback(() => {
    setState(s => ({ ...s, frozen: !s.frozen }));
  }, []);

  const setReview = useCallback((name) => {
    setState(s => {
      const catData = { ...s.catData };
      const meta = { ...catData._meta };
      const reviewedBy = [...(meta.reviewedBy || [])];
      const existing = reviewedBy.findIndex(r => r.name === name);
      if (existing >= 0) {
        reviewedBy[existing] = { name, date: new Date().toISOString(), status: 'approved' };
      } else {
        reviewedBy.push({ name, date: new Date().toISOString(), status: 'approved' });
      }
      meta.reviewedBy = reviewedBy;
      catData._meta = meta;
      return { ...s, catData };
    });
  }, []);

  const getOriginalText = useCallback((blockId) => {
    const catData = CATEGORY_DATA[categoryId];
    const chapters = mergeChapters(catData);
    for (const ch of chapters) {
      const bl = ch.blocks.find(b => b.id === blockId);
      if (bl) return bl.text;
    }
    return '';
  }, [categoryId]);

  const importState = useCallback((imported) => {
    const catData = CATEGORY_DATA[categoryId];
    const chapters = mergeChapters(catData);
    // Apply edited texts to chapters
    if (imported.editedTexts) {
      for (const ch of chapters) {
        for (const bl of ch.blocks) {
          if (imported.editedTexts[bl.id]) {
            bl.text = imported.editedTexts[bl.id];
          }
        }
      }
    }
    setState({
      categoryId,
      catData,
      chapters,
      selected: new Set(imported.selected || []),
      activeBlock: imported.activeBlock || chapters[0]?.blocks[0]?.id || '',
      vals: imported.vals || {},
      supVars: imported.supVars || {},
      delBlocks: new Set(imported.delBlocks || []),
      removedVars: imported.removedVars || {},
      altVars: imported.altVars || {},
      altProduct: imported.altProduct || {},
      editedTexts: imported.editedTexts || {},
      specOrder: imported.specOrder || {},
      customSpecs: imported.customSpecs || {},
      frozen: catData._meta?.frozen || false,
    });
  }, [categoryId]);

  return {
    state,
    save,
    setActiveBlock,
    toggleBlock,
    setVal,
    toggleDelegate,
    toggleDelegateBlock,
    toggleAltVar,
    toggleAltProduct,
    removeVar,
    restoreVar,
    restoreAllVars,
    updateText,
    resetCategory,
    setSpecOrder,
    addCustomSpec,
    toggleFreeze,
    setReview,
    getOriginalText,
    importState,
  };
}
