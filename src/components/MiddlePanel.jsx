import { useState, useRef, useCallback } from 'react';
import { C } from '../utils/colors.js';
import SpecGrid from './SpecGrid.jsx';
import AddCustomSpec from './AddCustomSpec.jsx';

const SUB_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function MiddlePanel({
  chapters, activeBlock, activeBlockContext, selectedBlocks, vals, editedTexts,
  delBlocks, removedVars, altVars, altProduct, frozen, customSpecs,
  onSetVal, onToggleDelegate, onToggleAltVar, onToggleAltProduct,
  onRemoveVar, onRestoreVar, onUpdateText, onAddCustomSpec,
  getOriginalText, isMultiProduct,
}) {
  // Use the pre-computed block context from the hook
  const ctx = activeBlockContext;
  const activeBlockData = ctx?.block || null;
  const activeChapter = ctx?.chapter || null;

  if (!activeBlockData) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: C.txtL,
        fontSize: 14,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        Selecteer een blok in het linkerpaneel
      </div>
    );
  }

  const isSelected = selectedBlocks.has(activeBlock);
  const isDelegated = delBlocks.has(activeBlock);
  const currentText = editedTexts[activeBlock] ?? activeBlockData.text;
  const originalText = getOriginalText(activeBlock);
  const isEdited = editedTexts[activeBlock] !== undefined && editedTexts[activeBlock] !== originalText;
  const blockVars = (activeBlockData.variables || []).filter(v => !removedVars.has(v.id) && v.type !== 'hidden');

  // Build breadcrumb
  let breadcrumb = `${activeChapter.number}. ${activeChapter.title}`;
  if (ctx.productIndex !== undefined && isMultiProduct) {
    breadcrumb = `${activeChapter.number}${SUB_LABELS[ctx.productIndex]}. ${ctx.productLabel || activeChapter.title}`;
  }

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '16px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Block header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, color: C.txtL }}>
          {breadcrumb} →
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.dk }}>
          {activeBlockData.label}
        </span>
        {isEdited && (
          <span style={{
            fontSize: 10, color: C.red, fontWeight: 600,
            border: `1px solid ${C.red}`, padding: '1px 6px', borderRadius: 3,
          }}>
            Bewerkt
          </span>
        )}
        <div style={{ flex: 1 }} />
        {!frozen && (
          <>
            <button
              onClick={() => onToggleDelegate(activeBlock)}
              style={{
                padding: '4px 10px',
                background: isDelegated ? C.blL : 'transparent',
                color: isDelegated ? C.bl : C.txtL,
                border: `1px solid ${isDelegated ? C.bl : C.bor}`,
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isDelegated ? '✓ Gedelegeerd' : 'Delegeren'}
            </button>
            <button
              onClick={onToggleAltProduct}
              style={{
                padding: '4px 10px',
                background: altProduct ? C.amberL : 'transparent',
                color: altProduct ? C.amber : C.txtL,
                border: `1px solid ${altProduct ? C.amber : C.bor}`,
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {altProduct ? '✓ Alternatief' : 'Alt. product'}
            </button>
          </>
        )}
      </div>

      {/* Text editor with protected variables */}
      <ProtectedTextEditor
        text={currentText}
        variables={activeBlockData.variables || []}
        vals={vals}
        removedVars={removedVars}
        frozen={frozen}
        isDelegated={isDelegated}
        onChange={(newText) => onUpdateText(activeBlock, newText)}
      />

      {/* Spec grid */}
      {blockVars.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.txtL, textTransform: 'uppercase', marginBottom: 8 }}>
            Specificaties
          </div>
          <SpecGrid
            variables={blockVars}
            vals={vals}
            delBlocks={delBlocks}
            altVars={altVars}
            removedVars={removedVars}
            frozen={frozen}
            onSetVal={onSetVal}
            onToggleAltVar={onToggleAltVar}
            onRemoveVar={onRemoveVar}
            onRestoreVar={onRestoreVar}
          />
        </div>
      )}

      {/* Custom specs */}
      {!frozen && (
        <AddCustomSpec onAdd={onAddCustomSpec} />
      )}

      {/* Custom specs display */}
      {customSpecs.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.txtL, marginBottom: 4 }}>
            Aangepaste specificaties
          </div>
          {customSpecs.map(spec => (
            <div key={spec.id} style={{
              padding: '8px 10px',
              background: C.lt,
              borderRadius: 4,
              marginBottom: 4,
              fontSize: 12,
            }}>
              <span style={{ fontWeight: 600 }}>{spec.label}</span>: {vals[spec.id] || spec.default || '—'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProtectedTextEditor({ text, variables, vals, removedVars, frozen, isDelegated, onChange }) {
  const editorRef = useRef(null);

  // Render text with variable badges
  const renderText = () => {
    if (!text) return '';
    let result = text;
    const varMap = {};
    for (const v of variables) {
      varMap[v.id] = v;
    }

    result = result.replace(/\{\{(\w+)\}\}/g, (match, varId) => {
      const v = varMap[varId];
      if (!v) return match;
      if (removedVars.has(varId)) return '';
      const value = vals[varId] || v.default || '';
      const isFilled = !!value && value !== v.default;
      const color = isDelegated ? C.bl : isFilled ? C.gr : C.o;
      const bg = isDelegated ? C.blL : isFilled ? C.grL : '#FFF5F2';
      return `<span contenteditable="false" data-var="${varId}" style="display:inline-block;padding:1px 8px;margin:0 2px;border-radius:4px;font-size:12px;font-weight:600;background:${bg};color:${color};border:1px solid ${color};cursor:pointer;user-select:none;vertical-align:baseline;">${value || v.label}</span>`;
    });

    return result;
  };

  const handleInput = useCallback((e) => {
    if (frozen) return;
    const el = e.target;
    let newText = '';
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        newText += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const varId = node.getAttribute('data-var');
        if (varId) {
          newText += `{{${varId}}}`;
        } else {
          newText += node.textContent;
        }
      }
    }
    onChange(newText);
  }, [frozen, onChange]);

  return (
    <div
      ref={editorRef}
      contentEditable={!frozen}
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: renderText().replace(/\n/g, '<br>') }}
      onInput={handleInput}
      style={{
        padding: '12px 14px',
        border: `1px solid ${isDelegated ? C.bl : C.bor}`,
        borderRadius: 6,
        background: frozen ? '#FAFAFA' : C.wh,
        fontSize: 13,
        lineHeight: 1.7,
        color: C.txt,
        minHeight: 120,
        maxHeight: 400,
        overflow: 'auto',
        outline: 'none',
        whiteSpace: 'pre-wrap',
        ...(isDelegated && { fontStyle: 'italic', borderColor: C.bl, borderWidth: 2 }),
      }}
    />
  );
}
