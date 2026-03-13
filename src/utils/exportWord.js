import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import entities from '../data/entities.json';

const SUB_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const BASE = import.meta.env.BASE_URL || '/';

// Template file mapping per entity
const TEMPLATE_MAP = {
  stp: `${BASE}templates/STM_Steel_Background.docx`,
  db_bv: `${BASE}templates/STM_Design___Build_BV_Background.docx`,
  db_gmbh: `${BASE}templates/STM_Design___Build_GmbH_Background.docx`,
  stm_group: `${BASE}templates/STM_Group_Background.docx`,
};

// Appendix manifest (inline to avoid extra fetch)
const APPENDIX_DATA = {
  metaalunie_nl: { title: 'Metaalunievoorwaarden 2019 (NL)', pages: 4, folder: 'metaalunie_nl' },
  metaalunie_de: { title: 'Allgemeine Geschäftsbedingungen der Metaalunie 2019', pages: 4, folder: 'metaalunie_de' },
  metaalunie_en: { title: 'General Conditions Staalmeesters BV (EN)', pages: 4, folder: 'metaalunie_en' },
  ava_2013: { title: 'AVA 2013 (Bouwend Nederland)', pages: 2, folder: 'ava_2013' },
  freistellung: { title: 'Freistellungsbescheinigung (§13b UStG)', pages: 1, folder: 'freistellung' },
};

const ENTITY_APPENDICES = {
  stp: ['metaalunie_nl'],
  db_bv: ['metaalunie_nl'],
  db_gmbh: ['metaalunie_de', 'freistellung'],
  stm_group: ['metaalunie_nl'],
};

/**
 * Export RFQ as .docx using the entity's Word template.
 * Injects OOXML body content, adds numbering for bullets, embeds appendix images.
 */
export async function exportWord({
  chapters, selectedBlocks, sharedVals, editedTexts, delBlocks,
  entityId, products, catMetas, contractType,
  getValsForProduct, getRemovedVarsForProduct, getAltVarsForProduct, getAltProductForProduct,
}) {
  const entity = entities[entityId] || entities.stp;
  const isMulti = products && products.length > 1;
  const supplierName = sharedVals.leverancierNaam || '[Leverancier]';
  const scopeTitle = products.map(p => p.label).join(', ');
  const projectName = sharedVals.projectNaam || '[Projectnaam]';

  // 1. Load the template
  const templateUrl = TEMPLATE_MAP[entityId] || TEMPLATE_MAP.stp;
  let templateBuf;
  try {
    const resp = await fetch(templateUrl);
    if (!resp.ok) throw new Error(`Template fetch failed: ${resp.status}`);
    templateBuf = await resp.arrayBuffer();
  } catch (err) {
    console.error('Template load error:', err);
    alert('Fout bij laden van template. Controleer of de templates in public/templates/ staan.');
    return;
  }

  const zip = await JSZip.loadAsync(templateBuf);

  // 2. Read document.xml and extract sectPr
  const docXml = await zip.file('word/document.xml').async('string');
  const sectPrMatch = docXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  const sectPr = sectPrMatch ? sectPrMatch[0] : '';

  // 3. Read existing relationships to find the max rId
  const relsXml = await zip.file('word/_rels/document.xml.rels').async('string');
  const rIdMatches = [...relsXml.matchAll(/Id="rId(\d+)"/g)];
  let maxRId = Math.max(...rIdMatches.map(m => parseInt(m[1])));

  // We need a numbering relationship
  const numRId = `rId${++maxRId}`;

  // 4. Build OOXML body paragraphs
  const bodyXml = [];

  // ── Meta header ──
  bodyXml.push(styledPara('EGmetaheading', esc(supplierName)));
  bodyXml.push(styledPara('EGmetaheading', `Onderwerp: RFQ — ${esc(scopeTitle)}`));
  // Contract type line
  if (contractType) {
    const ctParts = [];
    if (contractType.design) ctParts.push('Design');
    if (contractType.supply) ctParts.push('Supply');
    if (contractType.build) ctParts.push('Build');
    if (ctParts.length > 0) {
      bodyXml.push(styledPara('EGmetaheading', `Contracttype: ${ctParts.join(' + ')}`));
    }
  }
  bodyXml.push(emptyPara());
  bodyXml.push(normalPara(`Geachte heer/mevrouw,`));

  // ── Determine appendix keys (needed for bijlagen chapter) ──
  const conditionsVal = sharedVals.algVoorwaarden || '';
  let appendixKeys = [...(ENTITY_APPENDICES[entityId] || ['metaalunie_nl'])];
  if (conditionsVal.toLowerCase().includes('ava')) {
    appendixKeys = appendixKeys.map(k => k.startsWith('metaalunie') ? 'ava_2013' : k);
  }
  appendixKeys = [...new Set(appendixKeys)];

  // ── Chapters (auto-renumber, skip ch_bijlagen — handled separately) ──
  let chapterNum = 0;
  for (const ch of chapters) {
    // Skip bijlagen — rendered below with appendix images
    if (ch.chapterId === 'ch_bijlagen') continue;

    // Shared chapter
    if (ch.blocks) {
      const activeBlocks = ch.blocks.filter(b => selectedBlocks.has(b.id));
      if (activeBlocks.length === 0) continue;

      chapterNum++;
      bodyXml.push(heading3(`${chapterNum}. ${esc(ch.title)}`));

      for (const block of activeBlocks) {
        const isDelegated = delBlocks.has(block.id);
        const text = editedTexts[block.id] ?? block.text;
        bodyXml.push(...renderBlockOOXML(text, block.variables || [], sharedVals, new Set(), isDelegated));
      }
    }

    // Product chapter
    if (ch.productSections) {
      const hasActive = ch.productSections.some(sec =>
        sec.blocks.some(b => selectedBlocks.has(b.id))
      );
      if (!hasActive) continue;

      chapterNum++;
      bodyXml.push(heading3(`${chapterNum}. ${esc(ch.title)}`));

      for (let sIdx = 0; sIdx < ch.productSections.length; sIdx++) {
        const section = ch.productSections[sIdx];
        const activeBlocks = section.blocks.filter(b => selectedBlocks.has(b.id));
        if (activeBlocks.length === 0) continue;

        const productVals = getValsForProduct(section.productIndex);
        const productRemoved = getRemovedVarsForProduct(section.productIndex);
        const productAlt = getAltVarsForProduct(section.productIndex);
        const productAltProd = getAltProductForProduct(section.productIndex);

        if (isMulti) {
          const subLabel = `${chapterNum}${SUB_LABELS[sIdx]}`;
          bodyXml.push(heading4(`${subLabel}. ${esc(section.label)}`));
        }

        for (const block of activeBlocks) {
          const isDelegated = delBlocks.has(block.id);
          const text = editedTexts[block.id] ?? block.text;
          bodyXml.push(...renderBlockOOXML(text, block.variables || [], productVals, productRemoved, isDelegated));

          // Alt vars
          if (block.variables) {
            for (const v of block.variables) {
              if (productAlt.has(v.id) && v.altText) {
                bodyXml.push(altPara(esc(v.altText)));
              }
            }
          }
          if (productAltProd) {
            bodyXml.push(altPara('De Leverancier dient aanvullend een alternatief product aan te bieden en het verschil in prijs en technische prestatie aan te geven.'));
          }
        }
      }
    }
  }

  // ── Bijlagen chapter (merged with appendix listing) ──
  chapterNum++;
  bodyXml.push(emptyPara());
  bodyXml.push(heading3(`${chapterNum}. Bijlagen`));
  bodyXml.push(normalPara('Bij dit document zijn de volgende bijlagen gevoegd:'));
  for (let i = 0; i < appendixKeys.length; i++) {
    const aData = APPENDIX_DATA[appendixKeys[i]];
    if (aData) {
      bodyXml.push(bulletPara(`Bijlage ${i + 1} — ${esc(aData.title)}`));
    }
  }
  bodyXml.push(normalPara('De leverancier wordt geacht kennis te hebben genomen van bovenstaande bijlagen.'));

  // ── Closing ──
  bodyXml.push(emptyPara());
  bodyXml.push(normalPara('Met vriendelijke groet,'));
  bodyXml.push(emptyPara());
  bodyXml.push(styledPara('NoSpacing', esc(sharedVals.stmContact || '[STM Contactpersoon]')));
  bodyXml.push(styledPara('NoSpacing', esc(sharedVals.stmFunctie || 'Inkoper')));
  bodyXml.push(styledPara('NoSpacing', esc(entity.name)));

  // ── Fetch appendix images and add to ZIP ──
  const imageRels = []; // {rId, target}
  const imageElements = []; // OOXML strings
  let imgDocPropId = 100;
  const basePath = `${BASE}appendices`;

  for (let aIdx = 0; aIdx < appendixKeys.length; aIdx++) {
    const aKey = appendixKeys[aIdx];
    const aData = APPENDIX_DATA[aKey];
    if (!aData) continue;

    for (let pageNum = 1; pageNum <= aData.pages; pageNum++) {
      const imgFileName = `appendix_${aKey}_p${pageNum}.png`;
      const imgPath = `word/media/${imgFileName}`;
      const imgRId = `rId${++maxRId}`;

      try {
        const imgUrl = `${basePath}/${aData.folder}/page-${pageNum}.png`;
        const imgResp = await fetch(imgUrl);
        if (!imgResp.ok) {
          console.warn(`Could not fetch ${imgUrl}: ${imgResp.status}`);
          continue;
        }
        const imgBuf = await imgResp.arrayBuffer();
        zip.file(imgPath, imgBuf);
      } catch (err) {
        console.warn(`Appendix image fetch error:`, err);
        continue;
      }

      imageRels.push({ rId: imgRId, target: `media/${imgFileName}` });

      // Page break before each image page — no extra headings or empty paragraphs
      imageElements.push(pageBreak());

      const cx = 5940000;
      const cy = 9072000;
      imgDocPropId++;

      imageElements.push(`<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${imgDocPropId}" name="Appendix ${aIdx + 1} Page ${pageNum}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${imgDocPropId}" name="${esc(imgFileName)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${imgRId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`);
    }
  }

  // 7. Add numbering.xml for bullet lists
  const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="–"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:hint="default"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;

  zip.file('word/numbering.xml', numberingXml);

  // 8. Update document.xml.rels — add numbering + image rels
  let newRels = relsXml.replace('</Relationships>', '');
  newRels += `<Relationship Id="${numRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>`;
  for (const rel of imageRels) {
    newRels += `<Relationship Id="${rel.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${rel.target}"/>`;
  }
  newRels += '</Relationships>';
  zip.file('word/_rels/document.xml.rels', newRels);

  // 9. Update [Content_Types].xml — add numbering override if needed
  let contentTypes = await zip.file('[Content_Types].xml').async('string');
  if (!contentTypes.includes('numbering.xml')) {
    contentTypes = contentTypes.replace('</Types>',
      '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>');
  }
  zip.file('[Content_Types].xml', contentTypes);

  // 10. Assemble final document.xml
  // Extract all namespace declarations from the original document element
  const nsMatch = docXml.match(/<w:document\s([^>]*)>/);
  const nsAttrs = nsMatch ? nsMatch[1] : '';

  const finalDoc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${nsAttrs}><w:body>${bodyXml.join('')}${imageElements.join('')}${sectPr}</w:body></w:document>`;

  zip.file('word/document.xml', finalDoc);

  // 11. Generate and download
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const fileScope = products.length === 1
    ? products[0].label.replace(/\s+/g, '_')
    : `${products.length}_producten`;
  saveAs(blob, `RFQ_${entity.short}_${fileScope}_${projectName.replace(/\s+/g, '_')}.docx`);
}

// ── OOXML Paragraph Builders ──

function styledPara(styleId, ...runs) {
  const content = runs.join('');
  return `<w:p><w:pPr><w:pStyle w:val="${styleId}"/></w:pPr>${content.includes('<w:r') ? content : run(content)}</w:p>`;
}

function normalPara(...runs) {
  const content = runs.join('');
  return `<w:p>${content.includes('<w:r') ? content : run(content)}</w:p>`;
}

function emptyPara() {
  return '<w:p/>';
}

function heading3(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr>${run(text)}</w:p>`;
}

function heading4(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Heading4"/></w:pPr>${run(text)}</w:p>`;
}

function bulletPara(text) {
  return `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>${run(text)}</w:p>`;
}

function altPara(text) {
  return `<w:p><w:pPr><w:pBdr><w:left w:val="single" w:sz="12" w:space="4" w:color="D97706"/></w:pBdr><w:ind w:left="240"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="D97706"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function run(text) {
  return `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`;
}

function boldRun(text) {
  return `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;
}

function colorRun(text, color, opts = {}) {
  let rPr = `<w:color w:val="${color}"/>`;
  if (opts.bold) rPr += '<w:b/>';
  if (opts.italic) rPr += '<w:i/>';
  return `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;
}

function delegatedRun(text) {
  return `<w:r><w:rPr><w:i/><w:color w:val="4A90D9"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;
}

// ── Block text to OOXML paragraphs ──

function renderBlockOOXML(text, variables, vals, removedVars, isDelegated) {
  if (!text) return [];
  const varMap = {};
  for (const v of variables) varMap[v.id] = v;

  // Split text into lines
  const lines = text.split('\n');
  const paragraphs = [];
  let lastWasEmpty = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Max 1 empty paragraph between sections, never consecutive
      if (!lastWasEmpty && paragraphs.length > 0) {
        paragraphs.push(emptyPara());
        lastWasEmpty = true;
      }
      continue;
    }

    // Check if this line is ONLY toggleBlock variables (e.g. {{bankgarantie}}{{verzekeringen}})
    const toggleOnly = trimmed.replace(/\{\{(\w+)\}\}/g, (m, varId) => {
      const v = varMap[varId];
      return (v && v.toggleBlock) ? '' : m;
    }).trim();
    if (toggleOnly === '') {
      // Line consists entirely of toggleBlock vars — render each non-empty one as a separate paragraph
      const tbRegex = /\{\{(\w+)\}\}/g;
      let tbMatch;
      while ((tbMatch = tbRegex.exec(trimmed)) !== null) {
        const varId = tbMatch[1];
        const v = varMap[varId];
        if (!v || !v.toggleBlock) continue;
        const value = vals[varId] || v.default || '';
        if (!value) continue; // skip empty toggleBlock vars entirely
        // Render the toggleBlock value as its own paragraph(s)
        const tbLines = value.split('\n');
        for (const tbLine of tbLines) {
          const tbTrimmed = tbLine.trim();
          if (!tbTrimmed) continue;
          paragraphs.push(normalPara(run(esc(tbTrimmed))));
        }
      }
      lastWasEmpty = false;
      continue;
    }

    lastWasEmpty = false;

    // Check if this is a bullet line
    const bulletMatch = trimmed.match(/^[-–•]\s+(.+)$/);
    if (bulletMatch) {
      const content = bulletMatch[1];
      const runs = renderLineRuns(content, varMap, vals, removedVars, isDelegated);
      paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>${isDelegated ? '<w:rPr><w:i/><w:color w:val="4A90D9"/></w:rPr>' : ''}</w:pPr>${runs}</w:p>`);
      continue;
    }

    // Normal paragraph
    const runs = renderLineRuns(trimmed, varMap, vals, removedVars, isDelegated);
    if (isDelegated) {
      paragraphs.push(`<w:p><w:pPr><w:pBdr><w:left w:val="single" w:sz="12" w:space="4" w:color="4A90D9"/></w:pBdr></w:pPr>${runs}</w:p>`);
    } else {
      paragraphs.push(`<w:p>${runs}</w:p>`);
    }
  }

  return paragraphs;
}

function renderLineRuns(line, varMap, vals, removedVars, isDelegated) {
  // Split by {{varId}} patterns and generate runs
  const parts = [];
  let lastIdx = 0;
  const regex = /\{\{(\w+)\}\}/g;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', content: line.slice(lastIdx, match.index) });
    }
    const varId = match[1];
    const v = varMap[varId];
    if (v && !removedVars.has(varId)) {
      // Skip toggleBlock vars with no value (they're handled separately or hidden)
      if (v.toggleBlock) {
        const value = vals[varId] || v.default || '';
        if (!value) { lastIdx = match.index + match[0].length; continue; }
      }
      const value = vals[varId] || v.default || '';
      parts.push({ type: 'var', value: value || v.label, isFilled: !!value, isDelegated });
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < line.length) {
    parts.push({ type: 'text', content: line.slice(lastIdx) });
  }

  let xml = '';
  for (const p of parts) {
    if (p.type === 'text') {
      if (isDelegated) {
        xml += delegatedRun(esc(p.content));
      } else {
        xml += run(esc(p.content));
      }
    } else {
      // Variable
      if (p.isDelegated) {
        xml += colorRun(esc(p.value), '4A90D9', { italic: true, bold: true });
      } else if (p.isFilled) {
        xml += colorRun(esc(p.value), '2ECC71', { bold: true });
      } else {
        xml += colorRun(esc(p.value), 'F94816', { bold: true });
      }
    }
  }
  return xml;
}

// ── Escape XML ──
function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
