import entities from '../data/entities.json';
import { C } from './colors.js';

/**
 * Export RFQ as Word document (.doc via HTML Blob)
 */
export function exportWord({
  chapters, selectedBlocks, vals, editedTexts,
  delBlocks, removedVars, altVars, altProduct,
  entityId, categoryId, catMeta,
}) {
  const entity = entities[entityId] || entities.stp;

  const supplierName = vals.leverancierNaam || '[Leverancier]';
  const scopeTitle = catMeta?.scope || categoryId;
  const projectName = vals.projectNaam || '[Projectnaam]';

  let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  body { font-family: Calibri, 'Segoe UI', sans-serif; font-size: 10pt; color: #333; margin: 40px; }
  h3.chapter { font-size: 14pt; color: #C52F05; font-weight: bold; margin: 24pt 0 8pt; padding-bottom: 4pt; border-bottom: 2pt solid #C52F05; }
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
  html += `<p class="meta-heading">${supplierName}</p>`;
  html += `<p class="meta-heading">Onderwerp: RFQ — ${scopeTitle}</p>`;
  html += `<br/>`;

  // Chapters
  for (const ch of chapters) {
    const activeBlocks = (ch.blocks || []).filter(b => selectedBlocks.has(b.id));
    if (activeBlocks.length === 0) continue;

    html += `<h3 class="chapter">${ch.number}. ${ch.title}</h3>`;

    for (const block of activeBlocks) {
      const isDelegated = delBlocks.has(block.id);
      const text = editedTexts[block.id] ?? block.text;
      const rendered = renderWordText(text, block.variables || [], vals, removedVars, isDelegated);

      if (isDelegated) {
        html += `<div class="delegated-block">${rendered}</div>`;
      } else {
        html += `<div class="body-text">${rendered}</div>`;
      }

      // Alt vars
      if (block.variables) {
        for (const v of block.variables) {
          if (altVars.has(v.id) && v.altText) {
            html += `<div class="alt-section">${escapeHtml(v.altText)}</div>`;
          }
        }
      }

      // Alt product
      if (altProduct) {
        html += `<div class="alt-section">De Leverancier dient aanvullend een alternatief product aan te bieden en het verschil in prijs en technische prestatie aan te geven.</div>`;
      }
    }
  }

  // Closing
  html += `<br/><p class="body-text">Met vriendelijke groet,</p>`;
  html += `<br/><p class="body-text">${vals.stmContact || '[STM Contactpersoon]'}</p>`;
  html += `<p class="body-text">${entity.name}</p>`;

  // German compliance appendix
  if (entity.country === 'DE' && entity.freistellung) {
    html += `<br/><br/>`;
    html += `<h3 class="chapter">Freistellungsbescheinigung</h3>`;
    html += `<p class="body-text">Sicherheitsnummer: ${entity.freistellung.nummer}</p>`;
    html += `<p class="body-text">Gültig: ${entity.freistellung.validFrom} bis ${entity.freistellung.validTo}</p>`;
  }

  html += `</body></html>`;

  // Download
  const blob = new Blob([html], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `RFQ_${entity.short}_${scopeTitle.replace(/\s+/g, '_')}_${projectName.replace(/\s+/g, '_')}.doc`;
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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
