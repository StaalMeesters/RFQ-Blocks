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

export function loadPresets(categoryId) {
  try {
    const raw = localStorage.getItem(`${PREFIX}presets_${categoryId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function savePreset(categoryId, name, specValues) {
  const presets = loadPresets(categoryId);
  presets[name] = specValues;
  localStorage.setItem(`${PREFIX}presets_${categoryId}`, JSON.stringify(presets));
}

export function deletePreset(categoryId, name) {
  const presets = loadPresets(categoryId);
  delete presets[name];
  localStorage.setItem(`${PREFIX}presets_${categoryId}`, JSON.stringify(presets));
}
