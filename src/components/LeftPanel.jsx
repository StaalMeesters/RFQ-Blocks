import { useState } from 'react';
import { C } from '../utils/colors.js';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableChapter({ ch, isExpanded, onToggleExpand, selectedBlocks, onToggleBlock, activeBlock, onSetActive, delBlocks, frozen, montageEnabled, bimEnabled, onToggleMontage, onToggleBim }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: ch.chapterId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 2,
  };

  const isToggleable = ch.chapterId === 'ch_montage' || ch.chapterId === 'ch_bim';
  const isEnabled = ch.chapterId === 'ch_montage' ? montageEnabled : ch.chapterId === 'ch_bim' ? bimEnabled : true;

  const blockStatus = () => {
    if (!ch.blocks || ch.blocks.length === 0) return 'empty';
    const total = ch.blocks.length;
    const selected = ch.blocks.filter(b => selectedBlocks.has(b.id)).length;
    if (selected === total) return 'complete';
    if (selected > 0) return 'partial';
    return 'empty';
  };

  const statusColor = { complete: C.gr, partial: C.amber, empty: C.txtL }[blockStatus()];

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 8px',
          background: isExpanded ? '#F0F1F4' : 'transparent',
          borderRadius: 4,
          cursor: 'pointer',
        }}
        onClick={() => onToggleExpand(ch.chapterId)}
      >
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: frozen ? 'default' : 'grab', fontSize: 12, color: C.txtL, userSelect: 'none' }}
          onClick={e => e.stopPropagation()}
        >
          ≡
        </span>
        <span style={{ fontSize: 10, color: statusColor, lineHeight: 1 }}>●</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.dk, flex: 1 }}>
          {ch.number}. {ch.title}
        </span>
        {ch.shared && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            color: C.bl,
            background: C.blL,
            padding: '1px 5px',
            borderRadius: 3,
          }}>
            M
          </span>
        )}
        {isToggleable && (
          <label
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={ch.chapterId === 'ch_montage' ? onToggleMontage : onToggleBim}
              disabled={frozen}
              style={{ accentColor: C.o, width: 14, height: 14 }}
            />
          </label>
        )}
        <span style={{ fontSize: 10, color: C.txtL }}>{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && ch.blocks && (
        <div style={{ paddingLeft: 24, paddingTop: 2 }}>
          {ch.blocks.map(block => {
            const isSelected = selectedBlocks.has(block.id);
            const isActive = activeBlock === block.id;
            const isDelegated = delBlocks.has(block.id);
            return (
              <div
                key={block.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 6px',
                  borderRadius: 3,
                  background: isActive ? '#EBF0FF' : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => onSetActive(block.id)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleBlock(block.id)}
                  disabled={frozen}
                  onClick={e => e.stopPropagation()}
                  style={{ accentColor: C.o, width: 13, height: 13 }}
                />
                <span style={{
                  fontSize: 12,
                  color: isSelected ? C.dk : C.txtL,
                  flex: 1,
                  textDecoration: isSelected ? 'none' : 'line-through',
                }}>
                  {block.label}
                </span>
                {isDelegated && (
                  <span style={{ fontSize: 9, color: C.bl, fontWeight: 700 }}>DEL</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LeftPanel({
  chapters, selectedBlocks, activeBlock, delBlocks, frozen,
  onToggleBlock, onSetActive, onToggleDelegate,
  chapterOrder, onReorderChapters,
  montageEnabled, bimEnabled, onToggleMontage, onToggleBim,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [expanded, setExpanded] = useState(new Set(['ch_inleiding', 'ch_scope']));
  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragEnd = (event) => {
    if (frozen) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = chapterOrder.indexOf(active.id);
    const newIndex = chapterOrder.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderChapters(arrayMove(chapterOrder, oldIndex, newIndex));
  };

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '12px 8px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.txtL, textTransform: 'uppercase', marginBottom: 8, padding: '0 8px' }}>
        Hoofdstukken & Blokken
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={chapters.map(c => c.chapterId)} strategy={verticalListSortingStrategy}>
          {chapters.map(ch => (
            <SortableChapter
              key={ch.chapterId}
              ch={ch}
              isExpanded={expanded.has(ch.chapterId)}
              onToggleExpand={toggleExpand}
              selectedBlocks={selectedBlocks}
              onToggleBlock={onToggleBlock}
              activeBlock={activeBlock}
              onSetActive={onSetActive}
              delBlocks={delBlocks}
              frozen={frozen}
              montageEnabled={montageEnabled}
              bimEnabled={bimEnabled}
              onToggleMontage={onToggleMontage}
              onToggleBim={onToggleBim}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
