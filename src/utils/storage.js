const PREFIX = 'rfq_editor_';

export function loadCategory(categoryId) {
  try {
    const raw = localStorage.getItem(PREFIX + categoryId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCategory(categoryId, state) {
  try {
    const data = { ...state, savedAt: new Date().toISOString() };
    localStorage.setItem(PREFIX + categoryId, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearCategory(categoryId) {
  localStorage.removeItem(PREFIX + categoryId);
}

export function loadMasterOverrides() {
  try {
    const raw = localStorage.getItem(PREFIX + 'master_overrides');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveMasterOverrides(overrides) {
  try {
    localStorage.setItem(PREFIX + 'master_overrides', JSON.stringify(overrides));
    return true;
  } catch {
    return false;
  }
}
