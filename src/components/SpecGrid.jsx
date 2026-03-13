import { C } from '../utils/colors';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSpecCard({ v, val, isSup, isAlt, isCustom, frozen, onSetVal, onToggleDelegate, onToggleAltVar, onRemoveVar }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: v.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    border: `1px solid ${isSup ? C.bl : isAlt ? C.amber : C.bor}`,
    background: isSup ? C.blL : isAlt ? C.amberL : C.wh,
    borderRadius: 4,
    padding: '6px 8px',
    position: 'relative',
    borderStyle: isCustom ? 'dashed' : 'solid',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle */}
      {!frozen && (
        <span
          {...attributes}
          {...listeners}
          style={{
            position: 'absolute',
            top: 6,
            left: 2,
            cursor: 'grab',
            color: C.txtL,
            fontSize: 12,
            lineHeight: 1,
            userSelect: 'none',
          }}
          title="Drag to reorder"
        >
          &#8801;
        </span>
      )}
      {/* Remove button */}
      {!frozen && (
        <span
          onClick={() => onRemoveVar(v.id)}
          style={{
            position: 'absolute',
            top: 3,
            right: 6,
            cursor: 'pointer',
            color: C.txtL,
            fontSize: 15,
            lineHeight: 1,
          }}
          title="Remove"
        >
          &times;
        </span>
      )}
      <label style={{
        display: 'block',
        fontSize: 9,
        fontWeight: 600,
        color: C.dk2,
        textTransform: 'uppercase',
        marginBottom: 2,
        paddingLeft: frozen ? 0 : 14,
        paddingRight: 16,
      }}>
        {v.label}
        {isCustom && (
          <span style={{ marginLeft: 4, fontSize: 8, color: C.txtL, fontWeight: 400 }}>custom</span>
        )}
      </label>
      {v.type === 'select' ? (
        <select
          value={val || v.default || ''}
          onChange={e => onSetVal(v.id, e.target.value)}
          disabled={isSup || frozen}
          style={{
            width: '100%',
            padding: '4px 6px',
            border: `1px solid ${C.bor}`,
            borderRadius: 3,
            fontSize: 11,
          }}
        >
          <option value="">&mdash;</option>
          {(v.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : v.type === 'date' ? (
        <input
          type="date"
          value={val || ''}
          onChange={e => onSetVal(v.id, e.target.value)}
          disabled={isSup || frozen}
          style={{
            width: '100%',
            padding: '4px 6px',
            border: `1px solid ${C.bor}`,
            borderRadius: 3,
            fontSize: 11,
          }}
        />
      ) : v.type === 'textarea' ? (
        <textarea
          value={val || ''}
          placeholder={v.default || ''}
          onChange={e => onSetVal(v.id, e.target.value)}
          disabled={isSup || frozen}
          rows={3}
          style={{
            width: '100%',
            padding: '4px 6px',
            border: `1px solid ${C.bor}`,
            borderRadius: 3,
            fontSize: 11,
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          type={v.type === 'number' ? 'number' : 'text'}
          value={val || ''}
          placeholder={v.default || ''}
          onChange={e => onSetVal(v.id, e.target.value)}
          disabled={isSup || frozen}
          style={{
            width: '100%',
            padding: '4px 6px',
            border: `1px solid ${C.bor}`,
            borderRadius: 3,
            fontSize: 11,
          }}
        />
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
        {v.delegateText && (
          <span
            onClick={() => !frozen && onToggleDelegate(v.id)}
            style={{ fontSize: 9, color: isSup ? C.bl : C.txtL, cursor: frozen ? 'default' : 'pointer' }}
          >
            {isSup ? '\u2713 ' : ''}Delegate
          </span>
        )}
        {v.altText && (
          <span
            onClick={() => !frozen && onToggleAltVar(v.id)}
            style={{ fontSize: 9, color: isAlt ? C.amber : C.txtL, cursor: frozen ? 'default' : 'pointer' }}
          >
            {isAlt ? '\u2713 ' : ''}Request alt.
          </span>
        )}
      </div>
    </div>
  );
}

export default function SpecGrid({
  blockId, variables, vals, supVars, removedVars, altVars, customSpecs,
  frozen, onSetVal, onToggleDelegate, onToggleAltVar, onRemoveVar,
  onRestoreVar, onRestoreAllVars, onReorder,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeVars = variables.filter(v => !removedVars[v.id]);
  const removedList = variables.filter(v => removedVars[v.id]);
  const customIds = new Set((customSpecs || []).map(s => s.id));
  const hasRemoved = removedList.length > 0;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeVars.findIndex(v => v.id === active.id);
    const newIndex = activeVars.findIndex(v => v.id === over.id);
    const newOrder = arrayMove(activeVars, oldIndex, newIndex).map(v => v.id);
    onReorder(newOrder);
  };

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: C.dk2,
          textTransform: 'uppercase',
          flex: 1,
        }}>
          Specifications ({activeVars.length})
        </span>
        {hasRemoved && (
          <span
            onClick={onRestoreAllVars}
            style={{ fontSize: 9, color: C.o, cursor: 'pointer' }}
          >
            Restore all
          </span>
        )}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeVars.map(v => v.id)} strategy={rectSortingStrategy}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 8,
          }}>
            {activeVars.map(v => (
              <SortableSpecCard
                key={v.id}
                v={v}
                val={vals[v.id] || ''}
                isSup={!!supVars[v.id]}
                isAlt={!!altVars[v.id]}
                isCustom={customIds.has(v.id)}
                frozen={frozen}
                onSetVal={onSetVal}
                onToggleDelegate={onToggleDelegate}
                onToggleAltVar={onToggleAltVar}
                onRemoveVar={onRemoveVar}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Removed specs */}
      {hasRemoved && (
        <div style={{
          marginTop: 8,
          padding: '6px 8px',
          background: '#fafafa',
          borderRadius: 4,
          fontSize: 10,
          color: C.txtL,
        }}>
          Removed:{' '}
          {removedList.map(v => (
            <span
              key={v.id}
              onClick={() => onRestoreVar(v.id)}
              style={{
                display: 'inline-block',
                padding: '1px 6px',
                margin: '1px 2px',
                background: '#f0f0f0',
                borderRadius: 3,
                cursor: 'pointer',
                textDecoration: 'line-through',
              }}
            >
              {v.label} &#8634;
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
