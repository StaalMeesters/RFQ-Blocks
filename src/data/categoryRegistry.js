// Bundled fallbacks (used when runtime fetch fails)
import pg03_site_facilities from './categories/pg03_site_facilities.json';
import pg04_excavation from './categories/pg04_excavation.json';
import pg04_sewerage from './categories/pg04_sewerage.json';
import pg04_paving from './categories/pg04_paving.json';
import pg04_foundation_concrete from './categories/pg04_foundation_concrete.json';
import pg05_concrete_sandwich_panel from './categories/pg05_concrete_sandwich_panel.json';
import pg05_solid_concrete_panel from './categories/pg05_solid_concrete_panel.json';
import pg05_concrete_plinth from './categories/pg05_concrete_plinth.json';
import pg05_hollow_core_slab from './categories/pg05_hollow_core_slab.json';
import pg05_aerated_concrete from './categories/pg05_aerated_concrete.json';
import pg07_overhead_door from './categories/pg07_overhead_door.json';
import pg07_dock_leveller from './categories/pg07_dock_leveller.json';
import pg07_dock_shelter from './categories/pg07_dock_shelter.json';
import pg08_metal_sandwich_panel from './categories/pg08_metal_sandwich_panel.json';
import pg08_profiled_sheet from './categories/pg08_profiled_sheet.json';
import pg08_flat_sheet from './categories/pg08_flat_sheet.json';
import pg08_roofing_system from './categories/pg08_roofing_system.json';
import pg08_fall_protection from './categories/pg08_fall_protection.json';
import pg08_panel_montage from './categories/pg08_panel_montage.json';
import pg08_zetwerk from './categories/pg08_zetwerk.json';
import pg09_electrical from './categories/pg09_electrical.json';
import pg09_plumbing_hvac from './categories/pg09_plumbing_hvac.json';
import pg10_interior_walls from './categories/pg10_interior_walls.json';
import pg10_interior_floors from './categories/pg10_interior_floors.json';

const BUNDLED_DATA = {
  site_facilities: pg03_site_facilities,
  excavation: pg04_excavation,
  sewerage: pg04_sewerage,
  paving: pg04_paving,
  foundation_concrete: pg04_foundation_concrete,
  concrete_sandwich_panel: pg05_concrete_sandwich_panel,
  solid_concrete_panel: pg05_solid_concrete_panel,
  concrete_plinth: pg05_concrete_plinth,
  hollow_core_slab: pg05_hollow_core_slab,
  aerated_concrete: pg05_aerated_concrete,
  overhead_door: pg07_overhead_door,
  dock_leveller: pg07_dock_leveller,
  dock_shelter: pg07_dock_shelter,
  metal_sandwich_panel: pg08_metal_sandwich_panel,
  profiled_sheet: pg08_profiled_sheet,
  flat_sheet: pg08_flat_sheet,
  roofing_system: pg08_roofing_system,
  fall_protection: pg08_fall_protection,
  panel_montage: pg08_panel_montage,
  zetwerk: pg08_zetwerk,
  electrical: pg09_electrical,
  plumbing_hvac: pg09_plumbing_hvac,
  interior_walls: pg10_interior_walls,
  interior_floors: pg10_interior_floors,
};

// Mutable category data — runtime fetched data overlays bundled defaults
// Uses a Proxy so consumers always get the latest data via CATEGORY_DATA[id]
const runtimeOverrides = {};

export const CATEGORY_DATA = new Proxy(BUNDLED_DATA, {
  get(target, prop) {
    if (prop in runtimeOverrides) return runtimeOverrides[prop];
    return target[prop];
  },
  has(target, prop) {
    return prop in runtimeOverrides || prop in target;
  },
  ownKeys(target) {
    return [...new Set([...Object.keys(target), ...Object.keys(runtimeOverrides)])];
  },
  getOwnPropertyDescriptor(target, prop) {
    if (prop in runtimeOverrides || prop in target) {
      return { configurable: true, enumerable: true, value: runtimeOverrides[prop] || target[prop] };
    }
    return undefined;
  },
});

/**
 * Update a category with runtime-fetched data (replaces bundled version).
 */
export function setCategoryData(categoryId, data) {
  runtimeOverrides[categoryId] = data;
}

/**
 * Apply all runtime categories at once (called after initRuntimeData).
 */
export function applyRuntimeCategories(categoriesMap) {
  for (const [id, data] of Object.entries(categoriesMap)) {
    runtimeOverrides[id] = data;
  }
}

export const CATEGORY_LIST = [
  { id: 'site_facilities', pg: 'PG03', scope: 'Bouwplaatsvoorzieningen', scopeType: 'material', defaultMontage: false, defaultBIM: false },
  { id: 'excavation', pg: 'PG04', scope: 'Grondwerk & Ontgraving', scopeType: 'service', defaultMontage: true, defaultBIM: false },
  { id: 'sewerage', pg: 'PG04', scope: 'Riolering & Drainage', scopeType: 'service', defaultMontage: true, defaultBIM: false },
  { id: 'paving', pg: 'PG04', scope: 'Bestrating & Verharding', scopeType: 'service', defaultMontage: true, defaultBIM: false },
  { id: 'foundation_concrete', pg: 'PG04', scope: 'Funderingsbeton', scopeType: 'service', defaultMontage: true, defaultBIM: false },
  { id: 'concrete_sandwich_panel', pg: 'PG05', scope: 'Betonnen Sandwichpanelen', scopeType: 'material', defaultMontage: false, defaultBIM: true },
  { id: 'solid_concrete_panel', pg: 'PG05', scope: 'Massieve Betonpanelen', scopeType: 'material', defaultMontage: false, defaultBIM: true },
  { id: 'concrete_plinth', pg: 'PG05', scope: 'Betonnen Plint', scopeType: 'material', defaultMontage: false, defaultBIM: true },
  { id: 'hollow_core_slab', pg: 'PG05', scope: 'Kanaalplaatvloer', scopeType: 'material', defaultMontage: false, defaultBIM: true },
  { id: 'aerated_concrete', pg: 'PG05', scope: 'Cellenbeton (AAC)', scopeType: 'material', defaultMontage: false, defaultBIM: false },
  { id: 'overhead_door', pg: 'PG07', scope: 'Overheaddeuren & Laadvoorzieningen', scopeType: 'material', defaultMontage: true, defaultBIM: false },
  { id: 'dock_leveller', pg: 'PG07', scope: 'Dockleveller', scopeType: 'material', defaultMontage: true, defaultBIM: false },
  { id: 'dock_shelter', pg: 'PG07', scope: 'Dockshelter', scopeType: 'material', defaultMontage: true, defaultBIM: false },
  { id: 'metal_sandwich_panel', pg: 'PG08', scope: 'Metalen Sandwichpanelen', scopeType: 'material', defaultMontage: false, defaultBIM: true },
  { id: 'profiled_sheet', pg: 'PG08', scope: 'Geprofileerde Staalplaat', scopeType: 'material', defaultMontage: false, defaultBIM: false },
  { id: 'flat_sheet', pg: 'PG08', scope: 'Vlakke Staalplaat', scopeType: 'material', defaultMontage: false, defaultBIM: false },
  { id: 'roofing_system', pg: 'PG08', scope: 'Daksysteem', scopeType: 'service', defaultMontage: true, defaultBIM: false },
  { id: 'fall_protection', pg: 'PG08', scope: 'Valbeveiliging', scopeType: 'service', defaultMontage: true, defaultBIM: false },
  { id: 'panel_montage', pg: 'PG08', scope: 'Paneelmontage', scopeType: 'service', defaultMontage: true, defaultBIM: false },
  { id: 'zetwerk', pg: 'PG08', scope: 'Zetwerk & Aansluitingen', scopeType: 'material', defaultMontage: false, defaultBIM: false },
  { id: 'electrical', pg: 'PG09', scope: 'Elektrotechnische Installatie', scopeType: 'service', defaultMontage: true, defaultBIM: true },
  { id: 'plumbing_hvac', pg: 'PG09', scope: 'Sanitair & HVAC', scopeType: 'service', defaultMontage: true, defaultBIM: true },
  { id: 'interior_walls', pg: 'PG10', scope: 'Binnenwanden & Plafonds', scopeType: 'service', defaultMontage: true, defaultBIM: false },
  { id: 'interior_floors', pg: 'PG10', scope: 'Vloerafwerking', scopeType: 'service', defaultMontage: true, defaultBIM: false },
];

export const PG_GROUPS = [
  { pg: 'PG03', label: 'Bouwplaatsvoorzieningen' },
  { pg: 'PG04', label: 'Grondwerk & Civiel' },
  { pg: 'PG05', label: 'Betonelementen' },
  { pg: 'PG07', label: 'Deuren & Laadvoorzieningen' },
  { pg: 'PG08', label: 'Gevelbekleding & Dakwerk' },
  { pg: 'PG09', label: 'Installaties' },
  { pg: 'PG10', label: 'Interieurafwerking' },
];

export const DEFAULT_CHAPTER_ORDER = [
  'ch_rfq_info',
  'ch_inleiding',
  'ch_scope',
  'ch_technisch',
  'ch_normering',
  'ch_bim',
  'ch_montage',
  'ch_planning',
  'ch_financieel',
  'ch_offerte',
  'ch_bijlagen',
];
