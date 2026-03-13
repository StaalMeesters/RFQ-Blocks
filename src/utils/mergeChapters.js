import masterData from '../data/master-chapters.json';
import entities from '../data/entities.json';
import { DEFAULT_CHAPTER_ORDER } from '../data/categoryRegistry.js';
import { loadMasterOverrides } from './storage.js';

/**
 * Get master chapter data with localStorage overrides applied.
 */
function getMasterData(key) {
  const original = masterData[key];
  if (!original) return undefined;
  const overrides = loadMasterOverrides();
  if (!overrides[key]?.blocks) return original;
  // Clone and apply block text overrides
  const merged = JSON.parse(JSON.stringify(original));
  for (const [blockId, text] of Object.entries(overrides[key].blocks)) {
    const block = merged.blocks?.find(b => b.id === blockId);
    if (block) block.text = text;
  }
  return merged;
}

/** Chapters that are product-specific (duplicated per product in multi-product mode) */
export const PRODUCT_CHAPTER_IDS = ['ch_scope', 'ch_technisch', 'ch_normering'];

/**
 * Merge master shared chapters with category-specific chapters (single product).
 * Returns a chapter map keyed by chapter ID.
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
  chapterMap.ch_inleiding = cloneChapter(getMasterData('ch_inleiding'));

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
    chapterMap.ch_montage = cloneChapter(getMasterData('ch_montage'));
    fillOverride(chapterMap.ch_montage, 'montageScopeItems', overrides.ch_montage_scope);
    fillOverride(chapterMap.ch_montage, 'montageInbegrepen', overrides.ch_montage_grenzen);
  }

  // ch_normering — category-specific
  if (catChapters.ch_normering) {
    chapterMap.ch_normering = cloneChapter(catChapters.ch_normering);
  }

  // ch_bim — shared, toggleable
  if (bimEnabled) {
    chapterMap.ch_bim = cloneChapter(getMasterData('ch_bim'));
  }

  // ch_levering — shared, depends on scopeType
  const leveringKey = scopeType === 'service' ? 'ch_levering_service' : 'ch_levering_material';
  chapterMap.ch_levering = cloneChapter(getMasterData(leveringKey));

  // ch_prijs — shared + overrides
  chapterMap.ch_prijs = cloneChapter(getMasterData('ch_prijs'));
  fillOverride(chapterMap.ch_prijs, 'prijsOpbouwItems', overrides.ch_prijs_items);
  fillOverride(chapterMap.ch_prijs, 'toeslagItems', overrides.ch_prijs_toeslagen);

  // ch_financieel — shared
  chapterMap.ch_financieel = cloneChapter(getMasterData('ch_financieel'));
  fillEntityVars(chapterMap.ch_financieel, entity);

  // ch_wettelijk — per country
  const wettelijkKey = country === 'DE' ? 'ch_wettelijk_de' : 'ch_wettelijk_nl';
  chapterMap.ch_wettelijk = cloneChapter(getMasterData(wettelijkKey));
  if (country === 'DE' && entity.freistellung) {
    fillOverride(chapterMap.ch_wettelijk, 'freistellungNummer', entity.freistellung.nummer);
    fillOverride(chapterMap.ch_wettelijk, 'freistellungGeldigVan', entity.freistellung.validFrom);
    fillOverride(chapterMap.ch_wettelijk, 'freistellungGeldigTot', entity.freistellung.validTo);
  }

  // ch_uitsluitingen — shared + overrides
  chapterMap.ch_uitsluitingen = cloneChapter(getMasterData('ch_uitsluitingen'));
  fillOverride(chapterMap.ch_uitsluitingen, 'uitsluitingItems', overrides.ch_uitsluitingen_items);

  // ch_offerte — shared + overrides
  chapterMap.ch_offerte = cloneChapter(getMasterData('ch_offerte'));
  fillOverride(chapterMap.ch_offerte, 'vereistDocumenten', overrides.ch_offerte_documenten);

  // ch_bijlagen — shared
  chapterMap.ch_bijlagen = cloneChapter(getMasterData('ch_bijlagen'));
  const bijlagen = [`- ${entity.conditions}`];
  if (country === 'DE') bijlagen.push('- Freistellungsbescheinigung');
  if (bimEnabled) bijlagen.push('- BIM-vereisten');
  bijlagen.push('- Tekeningen');
  fillOverride(chapterMap.ch_bijlagen, 'bijlagenLijst', bijlagen.join('\n'));

  // Auto-fill entity name in inleiding
  fillOverride(chapterMap.ch_inleiding, 'bedrijfsnaam', entity.name);
  fillOverride(chapterMap.ch_inleiding, 'scopeBeschrijving', categoryJson._meta.scope);
  if (!montageEnabled) {
    fillOverride(chapterMap.ch_inleiding, 'montageClause', '');
  }

  return chapterMap;
}

/**
 * Merge chapters for multiple products.
 * products: [{ catJson, categoryId, label }, ...]
 * Returns a chapter map where product-specific chapters have productSections.
 */
export function mergeMultiProductChapters(products, entityId, options = {}) {
  const { montageEnabled = false, bimEnabled = false } = options;
  const entity = entities[entityId] || entities.stp;
  const country = entity.country;
  const isMulti = products.length > 1;

  // Determine scopeType: use 'service' if ANY product is service type
  const hasService = products.some(p => p.catJson._meta.scopeType === 'service');
  const scopeType = hasService ? 'service' : 'material';

  // Build shared chapters from master templates
  const chapterMap = {};

  // ch_inleiding
  chapterMap.ch_inleiding = cloneChapter(getMasterData('ch_inleiding'));
  fillOverride(chapterMap.ch_inleiding, 'bedrijfsnaam', entity.name);
  const scopeDesc = products.map(p => p.label).join(', ');
  fillOverride(chapterMap.ch_inleiding, 'scopeBeschrijving', scopeDesc);
  if (!montageEnabled) {
    fillOverride(chapterMap.ch_inleiding, 'montageClause', '');
  }

  // Product-specific chapters: ch_scope, ch_technisch, ch_normering
  for (const chId of PRODUCT_CHAPTER_IDS) {
    const sections = [];
    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const catChapters = prod.catJson.chapters || {};
      if (catChapters[chId]) {
        sections.push({
          productIndex: i,
          categoryId: prod.categoryId,
          label: prod.label,
          blocks: cloneChapter(catChapters[chId]).blocks || [],
        });
      }
    }
    if (sections.length > 0) {
      // Get title from the first product that has this chapter, or from master
      const firstCat = products.find(p => p.catJson.chapters?.[chId]);
      const title = firstCat?.catJson.chapters[chId].title
        || (chId === 'ch_scope' ? 'Scope van Levering'
          : chId === 'ch_technisch' ? 'Technische Specificatie'
            : 'Normering');
      chapterMap[chId] = {
        id: chId,
        title,
        isProductChapter: true,
        productSections: sections,
      };
    }
  }

  // ch_montage — shared, toggleable
  if (montageEnabled) {
    chapterMap.ch_montage = cloneChapter(getMasterData('ch_montage'));
    const montageParts = [];
    for (const prod of products) {
      const ov = prod.catJson.overrides || {};
      if (ov.ch_montage_scope) {
        montageParts.push(isMulti ? `--- ${prod.label} ---\n${ov.ch_montage_scope}` : ov.ch_montage_scope);
      }
    }
    if (montageParts.length > 0) fillOverride(chapterMap.ch_montage, 'montageScopeItems', montageParts.join('\n\n'));
    const grenzParts = [];
    for (const prod of products) {
      const ov = prod.catJson.overrides || {};
      if (ov.ch_montage_grenzen) {
        grenzParts.push(isMulti ? `--- ${prod.label} ---\n${ov.ch_montage_grenzen}` : ov.ch_montage_grenzen);
      }
    }
    if (grenzParts.length > 0) fillOverride(chapterMap.ch_montage, 'montageInbegrepen', grenzParts.join('\n\n'));
  }

  // ch_bim — shared, toggleable
  if (bimEnabled) {
    chapterMap.ch_bim = cloneChapter(getMasterData('ch_bim'));
  }

  // ch_levering
  const leveringKey = scopeType === 'service' ? 'ch_levering_service' : 'ch_levering_material';
  chapterMap.ch_levering = cloneChapter(getMasterData(leveringKey));

  // ch_prijs — merge overrides from all products
  chapterMap.ch_prijs = cloneChapter(getMasterData('ch_prijs'));
  mergeOverrideFromProducts(chapterMap.ch_prijs, 'prijsOpbouwItems', 'ch_prijs_items', products, isMulti);
  mergeOverrideFromProducts(chapterMap.ch_prijs, 'toeslagItems', 'ch_prijs_toeslagen', products, isMulti);

  // ch_financieel
  chapterMap.ch_financieel = cloneChapter(getMasterData('ch_financieel'));
  fillEntityVars(chapterMap.ch_financieel, entity);
  addContractTypeBlocks(chapterMap.ch_financieel, options.contractType);

  // ch_wettelijk
  const wettelijkKey = country === 'DE' ? 'ch_wettelijk_de' : 'ch_wettelijk_nl';
  chapterMap.ch_wettelijk = cloneChapter(getMasterData(wettelijkKey));
  if (country === 'DE' && entity.freistellung) {
    fillOverride(chapterMap.ch_wettelijk, 'freistellungNummer', entity.freistellung.nummer);
    fillOverride(chapterMap.ch_wettelijk, 'freistellungGeldigVan', entity.freistellung.validFrom);
    fillOverride(chapterMap.ch_wettelijk, 'freistellungGeldigTot', entity.freistellung.validTo);
  }

  // ch_uitsluitingen — merge from all products
  chapterMap.ch_uitsluitingen = cloneChapter(getMasterData('ch_uitsluitingen'));
  mergeOverrideFromProducts(chapterMap.ch_uitsluitingen, 'uitsluitingItems', 'ch_uitsluitingen_items', products, isMulti);

  // ch_offerte — merge from all products
  chapterMap.ch_offerte = cloneChapter(getMasterData('ch_offerte'));
  mergeOverrideFromProducts(chapterMap.ch_offerte, 'vereistDocumenten', 'ch_offerte_documenten', products, isMulti);

  // ch_bijlagen
  chapterMap.ch_bijlagen = cloneChapter(getMasterData('ch_bijlagen'));
  const bijlagen = [`- ${entity.conditions}`];
  if (country === 'DE') bijlagen.push('- Freistellungsbescheinigung');
  if (bimEnabled) bijlagen.push('- BIM-vereisten');
  bijlagen.push('- Tekeningen');
  fillOverride(chapterMap.ch_bijlagen, 'bijlagenLijst', bijlagen.join('\n'));

  return chapterMap;
}

/** Merge an override variable from all products into a single chapter */
function mergeOverrideFromProducts(chapter, varId, overrideKey, products, isMulti) {
  const parts = [];
  for (const prod of products) {
    const ov = prod.catJson.overrides || {};
    if (ov[overrideKey]) {
      parts.push(isMulti ? `--- ${prod.label} ---\n${ov[overrideKey]}` : ov[overrideKey]);
    }
  }
  if (parts.length > 0) fillOverride(chapter, varId, parts.join('\n\n'));
}

/**
 * Order chapters based on user order or defaults.
 * Handles both single-product (blocks) and multi-product (productSections) chapters.
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

/**
 * Add contract-type-specific payment term blocks to ch_financieel.
 */
function addContractTypeBlocks(chapter, contractType) {
  if (!chapter?.blocks || !contractType) return;
  const ct = contractType;
  const blocks = [];

  if (ct.design) {
    blocks.push({
      id: 'b_betaling_design',
      label: 'Betalingsvoorwaarden engineering',
      defaultOn: true,
      text: 'Betalingsvoorwaarden engineering:\n- 30% bij opdrachtbevestiging\n- 40% bij indiening voorlopig ontwerp / BIM-model\n- 30% bij goedkeuring definitief ontwerp',
      variables: [],
    });
  }

  if (ct.build) {
    blocks.push({
      id: 'b_betaling_build',
      label: 'Betalingsvoorwaarden uitvoering',
      defaultOn: true,
      text: 'Betalingsvoorwaarden uitvoering:\n- Maandelijkse termijnbetalingen op basis van goedgekeurde voortgangsrapportage\n- {{retentiePercentage}}% inhouding tot oplevering\n- Retentie wordt vrijgegeven na oplevering en afhandeling van restpunten',
      variables: [
        {
          id: 'retentiePercentage',
          label: 'Retentie (%)',
          type: 'number',
          source: 'manual',
          default: '5',
        },
      ],
    });
  }

  chapter.blocks.push(...blocks);
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
 * Get all variables from a chapter map, flattened.
 * Handles both single-product and multi-product chapter structures.
 */
export function getAllVariables(chapterMap) {
  const vars = [];
  for (const [chId, ch] of Object.entries(chapterMap)) {
    if (ch.blocks) {
      for (const block of ch.blocks) {
        if (!block.variables) continue;
        for (const v of block.variables) {
          vars.push({ ...v, chapterId: chId, blockId: block.id });
        }
      }
    }
    if (ch.productSections) {
      for (const section of ch.productSections) {
        for (const block of section.blocks) {
          if (!block.variables) continue;
          for (const v of block.variables) {
            vars.push({ ...v, chapterId: chId, blockId: block.id, productIndex: section.productIndex });
          }
        }
      }
    }
  }
  return vars;
}

/**
 * Build a map of blockId → productIndex from combined chapters.
 * Returns undefined for blocks in shared chapters.
 */
export function buildBlockProductMap(chapters) {
  const map = {};
  for (const ch of chapters) {
    if (ch.productSections) {
      for (const section of ch.productSections) {
        for (const block of section.blocks) {
          map[block.id] = section.productIndex;
        }
      }
    }
  }
  return map;
}

/**
 * Find a block and its context in the combined chapters structure.
 */
export function findBlockInChapters(chapters, blockId) {
  for (const ch of chapters) {
    if (ch.blocks) {
      for (const b of ch.blocks) {
        if (b.id === blockId) {
          return { block: b, chapter: ch, productIndex: undefined };
        }
      }
    }
    if (ch.productSections) {
      for (const section of ch.productSections) {
        for (const b of section.blocks) {
          if (b.id === blockId) {
            return { block: b, chapter: ch, productIndex: section.productIndex, productLabel: section.label };
          }
        }
      }
    }
  }
  return null;
}
