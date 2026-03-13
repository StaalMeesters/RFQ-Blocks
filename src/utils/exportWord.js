import entities from '../data/entities.json';
import { C } from './colors.js';

const SUB_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Export RFQ as Word document (.doc via HTML Blob).
 * Supports multi-product RFQ with product sub-sections.
 */
export function exportWord({
  chapters, selectedBlocks, sharedVals, editedTexts, delBlocks,
  entityId, products, catMetas,
  getValsForProduct, getRemovedVarsForProduct, getAltVarsForProduct, getAltProductForProduct,
}) {
  const entity = entities[entityId] || entities.stp;
  const isMulti = products && products.length > 1;

  const supplierName = sharedVals.leverancierNaam || '[Leverancier]';
  const scopeTitle = products.map(p => p.label).join(', ');
  const projectName = sharedVals.projectNaam || '[Projectnaam]';

  let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  body { font-family: Calibri, 'Segoe UI', sans-serif; font-size: 10pt; color: #333; margin: 40px; }
  h3.chapter { font-size: 14pt; color: #C52F05; font-weight: bold; margin: 24pt 0 8pt; padding-bottom: 4pt; border-bottom: 2pt solid #C52F05; }
  h4.subsection { font-size: 12pt; color: #22293B; font-weight: bold; margin: 16pt 0 6pt; padding-left: 8pt; border-left: 3pt solid #F94816; }
  .meta-heading { font-size: 7pt; color: #F94816; font-weight: bold; }
  .body-text { font-size: 10pt; line-height: 1.6; white-space: pre-wrap; }
  .var-pill { display: inline; font-weight: bold; }
  .var-filled { color: #2ECC71; }
  .var-empty { color: #F94816; }
  .var-delegated { color: #4A90D9; font-style: italic; }
  .delegated-block { color: #4A90D9; font-style: italic; border-left: 3pt solid #4A90D9; padding-left: 10pt; }
  .alt-section { background: #FEF3C7; padding: 6pt 10pt; border-radius: 4pt; font-style: italic; color: #D97706; margin: 6pt 0; }
  ul { margin: 4pt 0; padding-left: 20pt; }
  ul li { margin: 2pt 0; }
</style>
</head>
<body>`;

  // Meta header
  html += `<p class="meta-heading">${escapeHtml(supplierName)}</p>`;
  html += `<p class="meta-heading">Onderwerp: RFQ — ${escapeHtml(scopeTitle)}</p>`;
  html += `<br/>`;

  // Chapters
  for (const ch of chapters) {
    // ── Shared chapter (has blocks) ──
    if (ch.blocks) {
      const activeBlocks = ch.blocks.filter(b => selectedBlocks.has(b.id));
      if (activeBlocks.length === 0) continue;

      html += `<h3 class="chapter">${ch.number}. ${escapeHtml(ch.title)}</h3>`;

      for (const block of activeBlocks) {
        const isDelegated = delBlocks.has(block.id);
        const text = editedTexts[block.id] ?? block.text;
        const rendered = renderWordText(text, block.variables || [], sharedVals, new Set(), isDelegated);

        if (isDelegated) {
          html += `<div class="delegated-block">${rendered}</div>`;
        } else {
          html += `<div class="body-text">${rendered}</div>`;
        }
      }
    }

    // ── Product chapter (has productSections) ──
    if (ch.productSections) {
      const hasActive = ch.productSections.some(sec =>
        sec.blocks.some(b => selectedBlocks.has(b.id))
      );
      if (!hasActive) continue;

      html += `<h3 class="chapter">${ch.number}. ${escapeHtml(ch.title)}</h3>`;

      for (let sIdx = 0; sIdx < ch.productSections.length; sIdx++) {
        const section = ch.productSections[sIdx];
        const activeBlocks = section.blocks.filter(b => selectedBlocks.has(b.id));
        if (activeBlocks.length === 0) continue;

        const productVals = getValsForProduct(section.productIndex);
        const productRemoved = getRemovedVarsForProduct(section.productIndex);
        const productAlt = getAltVarsForProduct(section.productIndex);
        const productAltProd = getAltProductForProduct(section.productIndex);

        // Sub-section heading (hidden if single product)
        if (isMulti) {
          const subLabel = `${ch.number}${SUB_LABELS[sIdx]}`;
          html += `<h4 class="subsection">${subLabel}. ${escapeHtml(section.label)}</h4>`;
        }

        for (const block of activeBlocks) {
          const isDelegated = delBlocks.has(block.id);
          const text = editedTexts[block.id] ?? block.text;
          const rendered = renderWordText(text, block.variables || [], productVals, productRemoved, isDelegated);

          if (isDelegated) {
            html += `<div class="delegated-block">${rendered}</div>`;
          } else {
            html += `<div class="body-text">${rendered}</div>`;
          }

          // Alt vars
          if (block.variables) {
            for (const v of block.variables) {
              if (productAlt.has(v.id) && v.altText) {
                html += `<div class="alt-section">${escapeHtml(v.altText)}</div>`;
              }
            }
          }

          // Alt product
          if (productAltProd) {
            html += `<div class="alt-section">De Leverancier dient aanvullend een alternatief product aan te bieden en het verschil in prijs en technische prestatie aan te geven.</div>`;
          }
        }
      }
    }
  }

  // Closing
  html += `<br/><p class="body-text">Met vriendelijke groet,</p>`;
  html += `<br/><p class="body-text">${escapeHtml(sharedVals.stmContact || '[STM Contactpersoon]')}</p>`;
  html += `<p class="body-text">${escapeHtml(entity.name)}</p>`;

  // German compliance appendix
  if (entity.country === 'DE' && entity.freistellung) {
    html += `<br/><br/>`;
    html += `<h3 class="chapter">Freistellungsbescheinigung</h3>`;
    html += `<p class="body-text">Sicherheitsnummer: ${escapeHtml(entity.freistellung.nummer)}</p>`;
    html += `<p class="body-text">Gültig: ${escapeHtml(entity.freistellung.validFrom)} bis ${escapeHtml(entity.freistellung.validTo)}</p>`;
  }

  html += `</body></html>`;

  // Download
  const blob = new Blob([html], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const fileScope = products.length === 1
    ? products[0].label.replace(/\s+/g, '_')
    : `${products.length}_producten`;
  a.download = `RFQ_${entity.short}_${fileScope}_${projectName.replace(/\s+/g, '_')}.doc`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function renderWordText(text, variables, vals, removedVars, isDelegated) {
  if (!text) return '';
  const varMap = {};
  for (const v of variables) varMap[v.id] = v;

  let result = escapeHtml(text);

  result = result.replace(/\{\{(\w+)\}\}/g, (match, varId) => {
    const v = varMap[varId];
    if (!v) return match;
    if (removedVars.has(varId)) return '';
    const value = vals[varId] || v.default || '';
    const cls = isDelegated ? 'var-delegated' : value ? 'var-filled' : 'var-empty';
    return `<span class="var-pill ${cls}">${escapeHtml(value || v.label)}</span>`;
  });

  // Convert bullet lists
  result = result.replace(/^- (.+)$/gm, '<li>$1</li>');
  result = result.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  return result.replace(/\n/g, '<br/>');
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
