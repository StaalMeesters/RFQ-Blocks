const PREFIX = 'rfq_v2_';

export function loadState(entityId, categoryId) {
  try {
    const key = `${PREFIX}${entityId}_${categoryId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveState(entityId, categoryId, state) {
  try {
    const key = `${PREFIX}${entityId}_${categoryId}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) { console.error('Save failed:', e); }
}

/* ── Multi-product storage ── */

export function loadMultiState(entityId) {
  try {
    const key = `${PREFIX}multi_${entityId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveMultiState(entityId, state) {
  try {
    const key = `${PREFIX}multi_${entityId}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) { console.error('Multi-product save failed:', e); }
}

/* ── Presets storage ── */

export function loadPresets(categoryId) {
  try {
    const raw = localStorage.getItem(`${PREFIX}presets_${categoryId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function savePresets(categoryId, presets) {
  try {
    localStorage.setItem(`${PREFIX}presets_${categoryId}`, JSON.stringify(presets));
  } catch (e) { console.error('Preset save failed:', e); }
}

export function loadAllPresets() {
  try {
    const all = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`${PREFIX}presets_`)) {
        const catId = key.replace(`${PREFIX}presets_`, '');
        all[catId] = JSON.parse(localStorage.getItem(key));
      }
    }
    return all;
  } catch { return {}; }
}

export function importAllPresets(data) {
  try {
    for (const [catId, presets] of Object.entries(data)) {
      localStorage.setItem(`${PREFIX}presets_${catId}`, JSON.stringify(presets));
    }
  } catch (e) { console.error('Preset import failed:', e); }
}

/* ── Master chapter overrides ── */

const MASTER_KEY = `${PREFIX}master_chapters`;
const MASTER_FLAGS_KEY = `${PREFIX}master_flags`;

export function loadMasterOverrides() {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveMasterOverrides(overrides) {
  try {
    localStorage.setItem(MASTER_KEY, JSON.stringify(overrides));
  } catch (e) { console.error('Master override save failed:', e); }
}

export function loadMasterFlags() {
  try {
    const raw = localStorage.getItem(MASTER_FLAGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveMasterFlags(flags) {
  try {
    localStorage.setItem(MASTER_FLAGS_KEY, JSON.stringify(flags));
  } catch (e) { console.error('Master flags save failed:', e); }
}
