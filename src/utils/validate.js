export function validateCategoryJSON(data) {
  const errors = [];
  if (!data._meta) errors.push('Ontbreekt: _meta');
  else {
    if (!data._meta.id) errors.push('Ontbreekt: _meta.id');
    if (!data._meta.pg) errors.push('Ontbreekt: _meta.pg');
    if (!data._meta.scope) errors.push('Ontbreekt: _meta.scope');
    if (!data._meta.scopeType) errors.push('Ontbreekt: _meta.scopeType');
  }
  if (!data.chapters) errors.push('Ontbreekt: chapters');
  else {
    if (!data.chapters.ch_scope) errors.push('Ontbreekt: chapters.ch_scope');
  }
  return { valid: errors.length === 0, errors };
}

export function validateImportJSON(data) {
  const errors = [];
  if (!data) { errors.push('Geen data'); return { valid: false, errors }; }
  if (!data.entityId) errors.push('Ontbreekt: entityId');
  if (!data.categoryId) errors.push('Ontbreekt: categoryId');
  return { valid: errors.length === 0, errors };
}
