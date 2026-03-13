import masterData from '../data/master-chapters.json';
import entities from '../data/entities.json';
import { DEFAULT_CHAPTER_ORDER } from '../data/categoryRegistry.js';

/**
 * Merge master shared chapters with category-specific chapters.
 * Returns an ordered array of chapter objects.
 */
export function mergeChapters(categoryJson, entityId, options = {}) {
  const { montageEnabled = false, bimEnabled = false } = options;
  const entity = entities[entityId] || entities.stp;
  const country = entity.country; // NL or DE
  const scopeType = categoryJson._meta.scopeType;
  const catChapters = categoryJson.chapters || {};
  const overrides = categoryJson.overrides || {};

  const chapterMap = {};

  // ch_inleiding — shared
  chapterMap.ch_inleiding = cloneChapter(masterData.ch_inleiding);

  // ch_scope — category-specific
  if (catChapters.ch_scope) {
    chapterMap.ch_scope = cloneChapter(catChapters.ch_scope);
  }

  // ch_technisch — category-specific
  if (catChapters.ch_technisch) {
    chapterMap.ch_technisch = cloneChapter(catChapters.ch_technisch);
  }

  // ch_montage — shared, toggleable
  if (montageEnabled) {
    chapterMap.ch_montage = cloneChapter(masterData.ch_montage);
    // Fill overrides
    fillOverride(chapterMap.ch_montage, 'montageScopeItems', overrides.ch_montage_scope);
    fillOverride(chapterMap.ch_montage, 'montageInbegrepen', overrides.ch_montage_grenzen);
  }

  // ch_normering — category-specific
  if (catChapters.ch_normering) {
    chapterMap.ch_normering = cloneChapter(catChapters.ch_normering);
  }

  // ch_bim — shared, toggleable
  if (bimEnabled) {
    chapterMap.ch_bim = cloneChapter(masterData.ch_bim);
  }

  // ch_levering — shared, depends on scopeType
  const leveringKey = scopeType === 'service' ? 'ch_levering_service' : 'ch_levering_material';
  chapterMap.ch_levering = cloneChapter(masterData[leveringKey]);

  // ch_prijs — shared + overrides
  chapterMap.ch_prijs = cloneChapter(masterData.ch_prijs);
  fillOverride(chapterMap.ch_prijs, 'prijsOpbouwItems', overrides.ch_prijs_items);
  fillOverride(chapterMap.ch_prijs, 'toeslagItems', overrides.ch_prijs_toeslagen);

  // ch_financieel — shared
  chapterMap.ch_financieel = cloneChapter(masterData.ch_financieel);
  // Auto-fill entity variables
  fillEntityVars(chapterMap.ch_financieel, entity);

  // ch_wettelijk — per country
  const wettelijkKey = country === 'DE' ? 'ch_wettelijk_de' : 'ch_wettelijk_nl';
  chapterMap.ch_wettelijk = cloneChapter(masterData[wettelijkKey]);
  if (country === 'DE' && entity.freistellung) {
    fillOverride(chapterMap.ch_wettelijk, 'freistellungNummer', entity.freistellung.nummer);
    fillOverride(chapterMap.ch_wettelijk, 'freistellungGeldigVan', entity.freistellung.validFrom);
    fillOverride(chapterMap.ch_wettelijk, 'freistellungGeldigTot', entity.freistellung.validTo);
  }

  // ch_uitsluitingen — shared + overrides
  chapterMap.ch_uitsluitingen = cloneChapter(masterData.ch_uitsluitingen);
  fillOverride(chapterMap.ch_uitsluitingen, 'uitsluitingItems', overrides.ch_uitsluitingen_items);

  // ch_offerte — shared + overrides
  chapterMap.ch_offerte = cloneChapter(masterData.ch_offerte);
  fillOverride(chapterMap.ch_offerte, 'vereistDocumenten', overrides.ch_offerte_documenten);

  // ch_bijlagen — shared
  chapterMap.ch_bijlagen = cloneChapter(masterData.ch_bijlagen);
  // Auto-generate appendix list
  const bijlagen = [`- ${entity.conditions}`];
  if (country === 'DE') bijlagen.push('- Freistellungsbescheinigung');
  if (bimEnabled) bijlagen.push('- BIM-vereisten');
  bijlagen.push('- Tekeningen');
  fillOverride(chapterMap.ch_bijlagen, 'bijlagenLijst', bijlagen.join('\n'));

  // Auto-fill entity name in inleiding
  fillOverride(chapterMap.ch_inleiding, 'bedrijfsnaam', entity.name);
  // Auto-fill scope description
  fillOverride(chapterMap.ch_inleiding, 'scopeBeschrijving', categoryJson._meta.scope);
  // Handle montage clause
  if (!montageEnabled) {
    fillOverride(chapterMap.ch_inleiding, 'montageClause', '');
  }

  return chapterMap;
}

/**
 * Order chapters based on user order or defaults
 */
export function orderChapters(chapterMap, customOrder) {
  const order = customOrder || DEFAULT_CHAPTER_ORDER;
  const result = [];
  let num = 1;
  for (const chId of order) {
    if (chapterMap[chId]) {
      result.push({
        chapterId: chId,
        number: num,
        ...chapterMap[chId],
      });
      num++;
    }
  }
  return result;
}

function cloneChapter(ch) {
  return JSON.parse(JSON.stringify(ch));
}

function fillOverride(chapter, varId, value) {
  if (!chapter || !chapter.blocks || value === undefined) return;
  for (const block of chapter.blocks) {
    if (!block.variables) continue;
    for (const v of block.variables) {
      if (v.id === varId) {
        v.default = value;
      }
    }
  }
}

function fillEntityVars(chapter, entity) {
  if (!chapter || !chapter.blocks) return;
  for (const block of chapter.blocks) {
    if (!block.variables) continue;
    for (const v of block.variables) {
      if (v.source === 'entity') {
        switch (v.id) {
          case 'betalingstermijn': v.default = entity.defaultPayment; break;
          case 'factuurEmail': v.default = entity.invoiceEmail; break;
          case 'algVoorwaarden': v.default = entity.conditions; break;
          case 'algVoorwaardenRef': v.default = entity.conditionsRef; break;
          case 'bedrijfsnaam': v.default = entity.name; break;
        }
      }
    }
  }
}

/**
 * Get all variables from a chapter map, flattened
 */
export function getAllVariables(chapterMap) {
  const vars = [];
  for (const [chId, ch] of Object.entries(chapterMap)) {
    if (!ch.blocks) continue;
    for (const block of ch.blocks) {
      if (!block.variables) continue;
      for (const v of block.variables) {
        vars.push({ ...v, chapterId: chId, blockId: block.id });
      }
    }
  }
  return vars;
}
