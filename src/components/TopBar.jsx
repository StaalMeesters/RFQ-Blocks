import { C } from '../utils/colors.js';
import entities from '../data/entities.json';
import { CATEGORY_LIST, PG_GROUPS } from '../data/categoryRegistry.js';
import { useUser } from '../auth/AuthWrapper.jsx';
import { loadPresets, savePreset } from '../utils/storage.js';

export default function TopBar({
  entityId, categoryId, onCategoryChange, onBack,
  onUndo, onRedo, canUndo, canRedo,
  onReset, onExportJSON, onImportJSON, onExportWord,
  frozen, onToggleFreeze, reviewStatus, onSetReview,
}) {
  const { user, logout } = useUser();
  const entity = entities[entityId];
  const catInfo = CATEGORY_LIST.find(c => c.id === categoryId);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          onImportJSON(data);
        } catch { alert('Ongeldig JSON-bestand'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handlePresetSave = () => {
    const name = prompt('Naam voor preset:');
    if (!name) return;
    // This would need access to current vals — handled in App
    if (typeof onExportJSON === 'function') {
      const data = onExportJSON();
      savePreset(categoryId, name, data.vals || {});
    }
  };

  const btn = (label, onClick, opts = {}) => (
    <button
      onClick={onClick}
      disabled={opts.disabled}
      title={opts.title}
      style={{
        padding: '6px 12px',
        background: opts.bg || 'transparent',
        color: opts.disabled ? C.txtL : (opts.color || C.dk),
        border: `1px solid ${opts.disabled ? C.bor : (opts.borderColor || C.bor)}`,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        cursor: opts.disabled ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
        ...opts.style,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 16px',
      background: C.dk,
      color: C.wh,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      flexWrap: 'wrap',
    }}>
      {/* Logo + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <span style={{ color: C.o, fontWeight: 700, fontSize: 16 }}>STM</span>
        <span style={{ fontWeight: 300, fontSize: 13 }}>RFQ Editor</span>
      </div>

      {/* Entity badge */}
      <span style={{
        background: entity?.country === 'DE' ? C.dk2 : C.o,
        color: C.wh,
        padding: '3px 10px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
      }}>
        {entity?.short}
      </span>

      {/* Category dropdown */}
      <select
        value={categoryId}
        onChange={e => onCategoryChange(e.target.value)}
        style={{
          padding: '5px 8px',
          borderRadius: 4,
          border: `1px solid ${C.dk2}`,
          background: C.dk2,
          color: C.wh,
          fontSize: 12,
          maxWidth: 220,
        }}
      >
        {PG_GROUPS.map(g => (
          <optgroup key={g.pg} label={`${g.pg} — ${g.label}`}>
            {CATEGORY_LIST.filter(c => c.pg === g.pg).map(c => (
              <option key={c.id} value={c.id}>{c.scope}</option>
            ))}
          </optgroup>
        ))}
      </select>

      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {btn('↶ Ongedaan', onUndo, { disabled: !canUndo, color: C.wh, borderColor: C.dk2 })}
        {btn('↷ Opnieuw', onRedo, { disabled: !canRedo, color: C.wh, borderColor: C.dk2 })}
        <div style={{ width: 1, height: 20, background: C.dk2, margin: '0 4px' }} />
        {btn('Herstellen', onReset, { color: C.wh, borderColor: C.dk2 })}
        {btn('JSON ↓', () => {
          const data = onExportJSON();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `rfq_${entityId}_${categoryId}.json`;
          a.click();
        }, { color: C.wh, borderColor: C.dk2 })}
        {btn('JSON ↑', handleImport, { color: C.wh, borderColor: C.dk2 })}
        {btn('Word ⬇', onExportWord, { bg: C.o, color: C.wh, borderColor: C.o })}
        <div style={{ width: 1, height: 20, background: C.dk2, margin: '0 4px' }} />
        {btn(frozen ? '🔒 Bevroren' : '🔓 Concept', onToggleFreeze, {
          bg: frozen ? C.red : 'transparent',
          color: C.wh,
          borderColor: frozen ? C.red : C.dk2,
        })}
      </div>

      {/* Status */}
      <select
        value={reviewStatus}
        onChange={e => onSetReview(e.target.value)}
        style={{
          padding: '5px 8px',
          borderRadius: 4,
          border: `1px solid ${C.dk2}`,
          background: C.dk2,
          color: C.wh,
          fontSize: 11,
        }}
      >
        <option value="draft">Concept</option>
        <option value="review">In beoordeling</option>
        <option value="approved">Goedgekeurd</option>
      </select>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
        <span style={{ fontSize: 12, color: '#ccc' }}>{user?.name}</span>
        <button
          onClick={onBack}
          title="Terug naar selectie"
          style={{
            padding: '4px 8px',
            background: 'transparent',
            color: '#ccc',
            border: `1px solid ${C.dk2}`,
            borderRadius: 4,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          ← Terug
        </button>
        <button
          onClick={logout}
          style={{
            padding: '4px 8px',
            background: 'transparent',
            color: '#ccc',
            border: `1px solid ${C.dk2}`,
            borderRadius: 4,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Afmelden
        </button>
      </div>
    </div>
  );
}
