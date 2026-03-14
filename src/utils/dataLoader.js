import { CATEGORY_LIST } from '../data/categoryRegistry.js';

// Mutable runtime data store — starts null, populated by initRuntimeData()
let runtimeCategoryData = null;
let runtimeMasterChapters = null;

// Map categoryId → filename (e.g. "site_facilities" → "pg03_site_facilities.json")
const CATEGORY_FILENAMES = {};
for (const cat of CATEGORY_LIST) {
  CATEGORY_FILENAMES[cat.id] = `${cat.pg.toLowerCase()}_${cat.id}.json`;
}

export function getCategoryFilename(categoryId) {
  return CATEGORY_FILENAMES[categoryId] || `${categoryId}.json`;
}

/**
 * Get the base URL for fetching data files.
 * In production (GitHub Pages): /RFQ-Blocks/data/
 * In dev: /data/
 */
function getDataBaseUrl() {
  // Vite sets import.meta.env.BASE_URL from the `base` config
  const base = import.meta.env.BASE_URL || '/';
  return `${base}data/`;
}

/**
 * Fetch all category JSONs and master-chapters from public/data/ at runtime.
 * Falls back silently — bundled data remains the default.
 * Returns { categories: {id: json}, masterChapters: json }
 */
export async function initRuntimeData() {
  const baseUrl = getDataBaseUrl();
  const results = { categories: {}, masterChapters: null, loaded: false };

  try {
    // Fetch all categories in parallel
    const categoryPromises = CATEGORY_LIST.map(async (cat) => {
      const filename = getCategoryFilename(cat.id);
      try {
        const resp = await fetch(`${baseUrl}categories/${filename}`);
        if (resp.ok) {
          const json = await resp.json();
          results.categories[cat.id] = json;
        }
      } catch {
        // Silently fall back to bundled
      }
    });

    // Fetch master chapters
    const masterPromise = (async () => {
      try {
        const resp = await fetch(`${baseUrl}master-chapters.json`);
        if (resp.ok) {
          results.masterChapters = await resp.json();
        }
      } catch {
        // Silently fall back to bundled
      }
    })();

    await Promise.all([...categoryPromises, masterPromise]);

    // Store in mutable cache
    if (Object.keys(results.categories).length > 0) {
      runtimeCategoryData = results.categories;
    }
    if (results.masterChapters) {
      runtimeMasterChapters = results.masterChapters;
    }

    results.loaded = true;
  } catch {
    // Full fallback — bundled data will be used
  }

  return results;
}

/**
 * Get runtime category data (fetched from public/data/) or null if not loaded.
 */
export function getRuntimeCategoryData(categoryId) {
  return runtimeCategoryData?.[categoryId] || null;
}

/**
 * Get all runtime category data.
 */
export function getAllRuntimeCategoryData() {
  return runtimeCategoryData;
}

/**
 * Get runtime master chapters or null if not loaded.
 */
export function getRuntimeMasterChapters() {
  return runtimeMasterChapters;
}

/**
 * Update a single category in the runtime cache (after a save).
 */
export function updateRuntimeCategory(categoryId, data) {
  if (!runtimeCategoryData) runtimeCategoryData = {};
  runtimeCategoryData[categoryId] = data;
}

/**
 * Update master chapters in the runtime cache (after a save).
 */
export function updateRuntimeMasterChapters(data) {
  runtimeMasterChapters = data;
}
