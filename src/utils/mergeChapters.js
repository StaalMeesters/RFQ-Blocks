import masterChaptersData from '../data/master-chapters.json';

export function getMasterChapters() {
  return masterChaptersData;
}

export function mergeChapters(categoryData) {
  const master = masterChaptersData;
  const meta = categoryData._meta;
  const catChapters = categoryData.chapters;
  const overrides = categoryData.overrides || {};

  const chapters = [];

  // Ch1 — Introduction (master)
  const ch1 = JSON.parse(JSON.stringify(master.ch1_introduction));
  ch1.shared = true;
  // Auto-fill scopeDescription default from category
  const introBlock = ch1.blocks[0];
  if (introBlock) {
    const scopeVar = introBlock.variables.find(v => v.id === 'scopeDescription');
    if (scopeVar) {
      scopeVar.default = meta.scope;
    }
  }
  chapters.push(ch1);

  // Ch2 — Scope of Supply (category-specific)
  if (catChapters.ch2) {
    const ch2 = JSON.parse(JSON.stringify(catChapters.ch2));
    ch2.shared = false;
    chapters.push(ch2);
  }

  // Ch3 — Standards & Compliance (category-specific)
  if (catChapters.ch3) {
    const ch3 = JSON.parse(JSON.stringify(catChapters.ch3));
    ch3.shared = false;
    chapters.push(ch3);
  }

  // Ch4 — Delivery (master, variant based on scopeType)
  const ch4Key = meta.scopeType === 'service' ? 'ch4_delivery_service' : 'ch4_delivery_material';
  const ch4 = JSON.parse(JSON.stringify(master[ch4Key]));
  ch4.shared = true;
  chapters.push(ch4);

  // Ch5 — Pricing (master, with category override variables)
  const ch5 = JSON.parse(JSON.stringify(master.ch5_pricing));
  ch5.shared = true;
  const ch5Block = ch5.blocks[0];
  if (ch5Block) {
    const pbVar = ch5Block.variables.find(v => v.id === 'priceBreakdownItems');
    if (pbVar && overrides.ch5_priceBreakdownItems) {
      pbVar.default = overrides.ch5_priceBreakdownItems;
    }
    const scVar = ch5Block.variables.find(v => v.id === 'surchargeItems');
    if (scVar && overrides.ch5_surchargeItems) {
      scVar.default = overrides.ch5_surchargeItems;
    }
  }
  chapters.push(ch5);

  // Ch6 — Exclusions (master, with category override)
  const ch6 = JSON.parse(JSON.stringify(master.ch6_exclusions));
  ch6.shared = true;
  const ch6Block = ch6.blocks[0];
  if (ch6Block) {
    const exVar = ch6Block.variables.find(v => v.id === 'exclusionItems');
    if (exVar && overrides.ch6_exclusionItems) {
      exVar.default = overrides.ch6_exclusionItems;
    }
  }
  chapters.push(ch6);

  // Ch7 — Quotation Requirements (master, with category override)
  const ch7 = JSON.parse(JSON.stringify(master.ch7_submission));
  ch7.shared = true;
  const ch7Block = ch7.blocks[0];
  if (ch7Block) {
    const docVar = ch7Block.variables.find(v => v.id === 'requiredDocuments');
    if (docVar && overrides.ch7_requiredDocuments) {
      docVar.default = overrides.ch7_requiredDocuments;
    }
  }
  chapters.push(ch7);

  return chapters;
}
