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

export const CATEGORY_DATA = {
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

export const CATEGORY_LIST = [
  { id: 'site_facilities', pg: 'PG03', scope: 'Site Facilities', scopeType: 'material' },
  { id: 'excavation', pg: 'PG04', scope: 'Earthwork & Excavation', scopeType: 'service' },
  { id: 'sewerage', pg: 'PG04', scope: 'Sewerage & Drainage', scopeType: 'service' },
  { id: 'paving', pg: 'PG04', scope: 'Paving & Hardstanding', scopeType: 'service' },
  { id: 'foundation_concrete', pg: 'PG04', scope: 'Foundation Concrete', scopeType: 'service' },
  { id: 'concrete_sandwich_panel', pg: 'PG05', scope: 'Concrete Sandwich Panel', scopeType: 'material' },
  { id: 'solid_concrete_panel', pg: 'PG05', scope: 'Solid Concrete Panel', scopeType: 'material' },
  { id: 'concrete_plinth', pg: 'PG05', scope: 'Concrete Plinth', scopeType: 'material' },
  { id: 'hollow_core_slab', pg: 'PG05', scope: 'Hollow Core Slab', scopeType: 'material' },
  { id: 'aerated_concrete', pg: 'PG05', scope: 'Aerated Concrete (AAC)', scopeType: 'material' },
  { id: 'overhead_door', pg: 'PG07', scope: 'Overhead Door & Loading', scopeType: 'material' },
  { id: 'dock_leveller', pg: 'PG07', scope: 'Dock Leveller', scopeType: 'material' },
  { id: 'dock_shelter', pg: 'PG07', scope: 'Dock Shelter', scopeType: 'material' },
  { id: 'metal_sandwich_panel', pg: 'PG08', scope: 'Metal Sandwich Panel', scopeType: 'material' },
  { id: 'profiled_sheet', pg: 'PG08', scope: 'Profiled Steel Sheet', scopeType: 'material' },
  { id: 'flat_sheet', pg: 'PG08', scope: 'Flat Steel Sheet', scopeType: 'material' },
  { id: 'roofing_system', pg: 'PG08', scope: 'Roofing System', scopeType: 'service' },
  { id: 'fall_protection', pg: 'PG08', scope: 'Fall Protection', scopeType: 'service' },
  { id: 'panel_montage', pg: 'PG08', scope: 'Panel Montage', scopeType: 'service' },
  { id: 'zetwerk', pg: 'PG08', scope: 'Flashings & Zetwerk', scopeType: 'material' },
  { id: 'electrical', pg: 'PG09', scope: 'Electrical Installation', scopeType: 'service' },
  { id: 'plumbing_hvac', pg: 'PG09', scope: 'Plumbing & HVAC', scopeType: 'service' },
  { id: 'interior_walls', pg: 'PG10', scope: 'Interior Walls & Ceilings', scopeType: 'service' },
  { id: 'interior_floors', pg: 'PG10', scope: 'Interior Floor Finishing', scopeType: 'service' },
];

export const PG_GROUPS = [
  { pg: 'PG03', label: 'Site Facilities' },
  { pg: 'PG04', label: 'Civil Works' },
  { pg: 'PG05', label: 'Concrete Elements' },
  { pg: 'PG07', label: 'Doors & Loading' },
  { pg: 'PG08', label: 'Cladding & Roofing' },
  { pg: 'PG09', label: 'M&E Installations' },
  { pg: 'PG10', label: 'Interior Finishing' },
];
