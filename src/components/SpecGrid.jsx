import { C } from '../utils/colors.js';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSpecCard({ variable, value, isDelegated, isAlt, frozen, onSetVal, onToggleAlt, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: variable.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isFilled = !!value && value !== variable.default;

  const renderInput = () => {
    if (variable.type === 'select') {
      return (
        <select
          value={value || variable.default || ''}
          onChange={e => onSetVal(variable.id, e.target.value)}
          disabled={frozen || isDelegated}
          style={{
            width: '100%',
            padding: '4px 6px',
            borderRadius: 4,
            border: `1px solid ${C.bor}`,
            fontSize: 12,
            background: C.wh,
            color: C.dk,
          }}
        >
          <option value="">—</option>
          {(variable.options || []).map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }
    if (variable.type === 'textarea') {
      return (
        <textarea
          value={value || variable.default || ''}
          onChange={e => onSetVal(variable.id, e.target.value)}
          disabled={frozen || isDelegated}
          rows={3}
          style={{
            width: '100%',
            padding: '4px 6px',
            borderRadius: 4,
            border: `1px solid ${C.bor}`,
            fontSize: 12,
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      );
    }
    return (
      <input
        type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
        value={value || variable.default || ''}
        onChange={e => onSetVal(variable.id, e.target.value)}
        disabled={frozen || isDelegated}
        style={{
          width: '100%',
          padding: '4px 6px',
          borderRadius: 4,
          border: `1px solid ${C.bor}`,
          fontSize: 12,
        }}
      />
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '8px 10px',
        background: isDelegated ? C.blL : isAlt ? C.amberL : C.wh,
        border: `1px solid ${isDelegated ? C.bl : isAlt ? C.amber : isFilled ? C.gr : C.bor}`,
        borderRadius: 6,
        fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: frozen ? 'default' : 'grab', color: C.txtL, fontSize: 11, userSelect: 'none' }}
        >
          ≡
        </span>
        <span style={{ fontWeight: 600, color: C.dk, flex: 1, fontSize: 11 }}>
          {variable.label}
        </span>
        {!frozen && (
          <div style={{ display: 'flex', gap: 2 }}>
            {variable.altText && (
              <button
                onClick={() => onToggleAlt(variable.id)}
                title="Alternatief aanvragen"
                style={{
                  padding: '1px 5px',
                  background: isAlt ? C.amber : 'transparent',
                  color: isAlt ? C.wh : C.txtL,
                  border: `1px solid ${isAlt ? C.amber : C.bor}`,
                  borderRadius: 3,
                  fontSize: 9,
                  cursor: 'pointer',
                }}
              >
                Alt
              </button>
            )}
            <button
              onClick={() => onRemove(variable.id)}
              title="Verwijderen"
              style={{
                padding: '1px 5px',
                background: 'transparent',
                color: C.txtL,
                border: `1px solid ${C.bor}`,
                borderRadius: 3,
                fontSize: 9,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>
      {renderInput()}
      {isDelegated && variable.delegateText && (
        <div style={{ marginTop: 4, fontSize: 11, color: C.bl, fontStyle: 'italic' }}>
          {variable.delegateText}
        </div>
      )}
      {isAlt && variable.altText && (
        <div style={{ marginTop: 4, fontSize: 11, color: C.amber, fontStyle: 'italic' }}>
          {variable.altText}
        </div>
      )}
    </div>
  );
}

export default function SpecGrid({
  variables, vals, delBlocks, altVars, removedVars, frozen,
  onSetVal, onToggleAltVar, onRemoveVar, onRestoreVar,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const visibleVars = variables.filter(v => !removedVars.has(v.id));
  const hiddenVars = variables.filter(v => removedVars.has(v.id));

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter}>
        <SortableContext items={visibleVars.map(v => v.id)} strategy={rectSortingStrategy}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 8,
          }}>
            {visibleVars.map(v => (
              <SortableSpecCard
                key={v.id}
                variable={v}
                value={vals[v.id]}
                isDelegated={delBlocks.has?.(v.id) || false}
                isAlt={altVars.has(v.id)}
                frozen={frozen}
                onSetVal={onSetVal}
                onToggleAlt={onToggleAltVar}
                onRemove={onRemoveVar}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {hiddenVars.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: C.txtL }}>Verwijderd:</span>
          {hiddenVars.map(v => (
            <button
              key={v.id}
              onClick={() => onRestoreVar(v.id)}
              style={{
                padding: '2px 6px',
                background: '#FEE',
                color: C.red,
                border: `1px solid ${C.red}`,
                borderRadius: 3,
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              ↩ {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
