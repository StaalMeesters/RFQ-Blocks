import { useState } from 'react';
import { C } from '../utils/colors';
import SpecGrid from './SpecGrid';
import AddCustomSpec from './AddCustomSpec';

export default function MiddlePanel({
  chapters, activeBlock, selected, vals, supVars, delBlocks,
  removedVars, altVars, altProduct, editedTexts, specOrder, customSpecs, frozen,
  onSetVal, onToggleDelegate, onToggleDelegateBlock, onToggleAltVar,
  onToggleAltProduct, onRemoveVar, onRestoreVar, onRestoreAllVars,
  onUpdateText, onSetSpecOrder, onAddCustomSpec,
}) {
  let activeBlockData = null;
  let activeChapter = null;
  for (const ch of chapters) {
    const bl = ch.blocks.find(b => b.id === activeBlock);
    if (bl) { activeBlockData = bl; activeChapter = ch; break; }
  }

  if (!activeBlockData) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.txtL }}>
        Select a block from the left panel
      </div>
    );
  }

  const isSelected = selected.has(activeBlock);
  const isDelegated = delBlocks.has(activeBlock);
  const isAlt = altProduct[activeBlock];
  const blockVars = activeBlockData.variables || [];
  const blockCustom = customSpecs[activeBlock] || [];
  const allVars = [...blockVars, ...blockCustom];

  // Get ordered variables
  const order = specOrder[activeBlock];
  const orderedVars = order
    ? order.map(id => allVars.find(v => v.id === id)).filter(Boolean)
    : allVars;
  // Add any vars not in order
  const orderedIds = new Set(orderedVars.map(v => v.id));
  const remaining = allVars.filter(v => !orderedIds.has(v.id));
  const finalVars = [...orderedVars, ...remaining];

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minWidth: 300 }}>
      {/* Block header */}
      <div style={{
        padding: '8px 14px',
        borderBottom: `1px solid ${C.bor}`,
        background: C.wh,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 9, color: C.o, fontWeight: 700 }}>{activeChapter.number}.</span>
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{activeBlockData.label}</span>
        {isSelected && !frozen && (
          <>
            <button
              onClick={() => onToggleDelegateBlock(activeBlock)}
              style={{
                padding: '3px 8px',
                borderRadius: 3,
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${isDelegated ? C.bl : C.bor}`,
                background: isDelegated ? C.blL : C.wh,
                color: isDelegated ? C.bl : C.txtL,
              }}
            >
              {isDelegated ? '\u2713 ' : ''}Delegate block
            </button>
            <button
              onClick={() => onToggleAltProduct(activeBlock)}
              style={{
                padding: '3px 8px',
                borderRadius: 3,
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${isAlt ? C.amber : C.bor}`,
                background: isAlt ? C.amberL : C.wh,
                color: isAlt ? C.amber : C.txtL,
              }}
            >
              {isAlt ? '\u2713 ' : ''}Request alt product
            </button>
          </>
        )}
        {frozen && (
          <span style={{ fontSize: 9, color: C.txtL, fontStyle: 'italic' }}>Frozen</span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
        {!isSelected ? (
          <div style={{ color: C.txtL, textAlign: 'center', padding: 40, fontSize: 12 }}>
            Not selected &mdash; check in left panel to include.
          </div>
        ) : isDelegated ? (
          <div style={{ color: C.bl, textAlign: 'center', padding: 40, fontSize: 12, fontStyle: 'italic' }}>
            Delegated to Supplier. The Supplier shall specify this scope in full.
          </div>
        ) : (
          <>
            {/* Text editor */}
            <textarea
              value={activeBlockData.text}
              onChange={e => onUpdateText(activeBlock, e.target.value)}
              readOnly={frozen}
              style={{
                width: '100%',
                minHeight: 220,
                padding: 12,
                border: `1px solid ${C.bor}`,
                borderRadius: 6,
                fontSize: 12.5,
                lineHeight: 1.8,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                background: frozen ? '#f9f9f9' : C.wh,
              }}
              onFocus={e => { if (!frozen) e.target.style.borderColor = C.o; }}
              onBlur={e => { e.target.style.borderColor = C.bor; }}
            />

            {/* Alt product notice */}
            {isAlt && (
              <div style={{
                marginTop: 10,
                padding: '8px 12px',
                background: C.amberL,
                border: `1px solid ${C.amber}`,
                borderRadius: 6,
                fontSize: 11,
                color: C.amber,
              }}>
                <strong>Alternative product requested.</strong> The Supplier shall quote an alternative product separately with full technical details.
              </div>
            )}

            {/* Spec grid */}
            {finalVars.length > 0 && (
              <SpecGrid
                blockId={activeBlock}
                variables={finalVars}
                vals={vals[activeBlock] || {}}
                supVars={supVars[activeBlock] || {}}
                removedVars={removedVars[activeBlock] || {}}
                altVars={altVars[activeBlock] || {}}
                customSpecs={blockCustom}
                frozen={frozen}
                onSetVal={(varId, val) => onSetVal(activeBlock, varId, val)}
                onToggleDelegate={(varId) => onToggleDelegate(activeBlock, varId)}
                onToggleAltVar={(varId) => onToggleAltVar(activeBlock, varId)}
                onRemoveVar={(varId) => onRemoveVar(activeBlock, varId)}
                onRestoreVar={(varId) => onRestoreVar(activeBlock, varId)}
                onRestoreAllVars={() => onRestoreAllVars(activeBlock)}
                onReorder={(newOrder) => onSetSpecOrder(activeBlock, newOrder)}
              />
            )}

            {/* Add custom spec */}
            {!frozen && (
              <AddCustomSpec
                onAdd={(spec) => onAddCustomSpec(activeBlock, spec)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
