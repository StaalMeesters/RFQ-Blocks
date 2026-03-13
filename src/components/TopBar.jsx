import { useState, useRef, useEffect } from 'react';
import { C } from '../utils/colors.js';
import entities from '../data/entities.json';
import { useUser } from '../auth/AuthWrapper.jsx';
import { loadPresets, savePresets, loadAllPresets, importAllPresets } from '../utils/storage.js';

export default function TopBar({
  entityId, products, onBack,
  onUndo, onRedo, canUndo, canRedo,
  onReset, onExportJSON, onImportJSON, onExportWord,
  frozen, onToggleFreeze, reviewStatus, onSetReview,
  activeProductIndex, onLoadPreset, getValsForProduct,
}) {
  const { user, logout } = useUser();
  const entity = entities[entityId];

  // Preset state
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const presetDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!presetDropdownOpen) return;
    const handler = (e) => {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(e.target)) {
        setPresetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [presetDropdownOpen]);

  // Get active product info
  const activeProduct = products?.[activeProductIndex] || products?.[0];
  const activeCategoryId = activeProduct?.categoryId;

  // Load presets for active category
  const presets = activeCategoryId ? loadPresets(activeCategoryId) : [];

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

  // ── Preset: Save ──
  const handlePresetSave = () => {
    if (!presetName.trim() || !activeCategoryId) return;
    const vals = getValsForProduct(activeProductIndex ?? 0);
    const preset = {
      name: presetName.trim(),
      savedBy: user?.name || 'Onbekend',
      savedAt: new Date().toISOString(),
      values: { ...vals },
    };
    const current = loadPresets(activeCategoryId);
    savePresets(activeCategoryId, [...current, preset]);
    setPresetName('');
    setPresetDialogOpen(false);
  };

  // ── Preset: Load ──
  const handlePresetLoad = (preset) => {
    if (!activeCategoryId) return;
    if (!confirm('Dit overschrijft de huidige specificaties. Doorgaan?')) return;
    onLoadPreset(activeCategoryId, preset.values);
    setPresetDropdownOpen(false);
  };

  // ── Preset: Delete ──
  const handlePresetDelete = (index, e) => {
    e.stopPropagation();
    if (!confirm('Deze standaard verwijderen?')) return;
    const current = loadPresets(activeCategoryId);
    current.splice(index, 1);
    savePresets(activeCategoryId, current);
    // Force re-render by toggling dropdown
    setPresetDropdownOpen(false);
    setTimeout(() => setPresetDropdownOpen(true), 0);
  };

  // ── Preset: Export all ──
  const handlePresetExportAll = () => {
    const all = loadAllPresets();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rfq_standaarden.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Preset: Import all ──
  const handlePresetImportAll = () => {
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
          importAllPresets(data);
          alert('Standaarden geïmporteerd!');
        } catch { alert('Ongeldig bestand'); }
      };
      reader.readAsText(file);
    };
    input.click();
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

      {/* Products summary */}
      <span style={{
        fontSize: 12,
        color: '#ccc',
        maxWidth: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }} title={products?.map(p => p.label).join(', ')}>
        {products?.length === 1
          ? products[0].label
          : `${products?.length || 0} producten`}
      </span>

      {/* Separator */}
      <div style={{ width: 1, height: 20, background: C.dk2, margin: '0 4px' }} />

      {/* ── Preset buttons ── */}

      {/* Load preset dropdown */}
      <div ref={presetDropdownRef} style={{ position: 'relative' }}>
        {btn('Standaard laden ▾', () => setPresetDropdownOpen(prev => !prev), {
          color: C.wh,
          borderColor: C.dk2,
          disabled: !activeCategoryId,
        })}

        {presetDropdownOpen && activeCategoryId && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: C.wh,
            border: `1px solid ${C.bor}`,
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            minWidth: 280,
            maxWidth: 360,
            zIndex: 100,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.bor}`, fontSize: 11, fontWeight: 700, color: C.txtL, textTransform: 'uppercase' }}>
              Standaarden — {activeProduct?.label}
            </div>

            {presets.length === 0 ? (
              <div style={{ padding: '12px', fontSize: 12, color: C.txtL, fontStyle: 'italic' }}>
                Geen standaarden opgeslagen
              </div>
            ) : (
              presets.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handlePresetLoad(preset)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${C.bor}`,
                    fontSize: 12,
                    color: C.dk,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.lt}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{preset.name}</div>
                    <div style={{ fontSize: 10, color: C.txtL }}>
                      {preset.savedBy} — {new Date(preset.savedAt).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handlePresetDelete(idx, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: C.red,
                      fontSize: 14,
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: 3,
                    }}
                    title="Verwijderen"
                  >
                    ×
                  </button>
                </div>
              ))
            )}

            <div style={{ display: 'flex', gap: 4, padding: '8px', borderTop: `1px solid ${C.bor}` }}>
              <button onClick={handlePresetExportAll} style={{
                flex: 1, padding: '4px 8px', fontSize: 10, background: C.lt, border: `1px solid ${C.bor}`,
                borderRadius: 3, cursor: 'pointer', color: C.dk,
              }}>Exporteer standaarden</button>
              <button onClick={handlePresetImportAll} style={{
                flex: 1, padding: '4px 8px', fontSize: 10, background: C.lt, border: `1px solid ${C.bor}`,
                borderRadius: 3, cursor: 'pointer', color: C.dk,
              }}>Importeer standaarden</button>
            </div>
          </div>
        )}
      </div>

      {/* Save preset */}
      {btn('Standaard opslaan', () => setPresetDialogOpen(true), {
        color: C.wh,
        borderColor: C.dk2,
        disabled: !activeCategoryId,
      })}

      {/* Preset save dialog */}
      {presetDialogOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
        }} onClick={() => setPresetDialogOpen(false)}>
          <div style={{
            background: C.wh,
            padding: 24,
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            minWidth: 360,
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, color: C.dk }}>
              Standaard opslaan — {activeProduct?.label}
            </h3>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 6 }}>
              Naam van de standaard:
            </label>
            <input
              type="text"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder="bijv. STM Standaard — Wandbeplating"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handlePresetSave(); }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${C.bor}`,
                borderRadius: 4,
                fontSize: 13,
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setPresetDialogOpen(false)} style={{
                padding: '6px 16px', background: 'transparent', border: `1px solid ${C.bor}`,
                borderRadius: 4, fontSize: 12, cursor: 'pointer', color: C.dk,
              }}>Annuleren</button>
              <button onClick={handlePresetSave} disabled={!presetName.trim()} style={{
                padding: '6px 16px', background: presetName.trim() ? C.o : C.bor,
                color: C.wh, border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600,
                cursor: presetName.trim() ? 'pointer' : 'default',
              }}>Opslaan</button>
            </div>
          </div>
        </div>
      )}

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
          a.download = `rfq_${entityId}_multi.json`;
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
