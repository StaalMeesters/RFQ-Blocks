export function validateCategoryJSON(json) {
  const errors = [];

  if (!json._meta) errors.push('Missing _meta');
  else {
    if (!json._meta.id) errors.push('Missing _meta.id');
    if (!json._meta.pg) errors.push('Missing _meta.pg');
    if (!json._meta.scope) errors.push('Missing _meta.scope');
    if (!json._meta.scopeType) errors.push('Missing _meta.scopeType');
  }

  if (!json.chapters) errors.push('Missing chapters');
  else {
    if (!json.chapters.ch2) errors.push('Missing chapters.ch2');
    if (!json.chapters.ch3) errors.push('Missing chapters.ch3');

    for (const chKey of ['ch2', 'ch3']) {
      const ch = json.chapters[chKey];
      if (!ch) continue;
      if (!ch.blocks || !Array.isArray(ch.blocks)) {
        errors.push(`${chKey}: blocks must be an array`);
        continue;
      }
      for (const block of ch.blocks) {
        if (!block.id) errors.push(`${chKey}: block missing id`);
        if (!block.label) errors.push(`${chKey}: block missing label`);
        if (typeof block.text !== 'string') errors.push(`${chKey}.${block.id}: missing text`);
        if (block.variables && !Array.isArray(block.variables)) {
          errors.push(`${chKey}.${block.id}: variables must be an array`);
        }
      }
    }
  }

  if (!json.overrides) errors.push('Missing overrides');

  return { valid: errors.length === 0, errors };
}

export function validateImportJSON(json) {
  const errors = [];
  if (!json.categoryId) errors.push('Missing categoryId');
  if (!json.selected && !Array.isArray(json.selected)) errors.push('Missing or invalid selected');
  return { valid: errors.length === 0, errors };
}
