import { useState } from 'react';
import { C } from '../utils/colors.js';
import { CATEGORY_LIST, PG_GROUPS } from '../data/categoryRegistry.js';
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

const SUB_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function BlockItem({ block, isSelected, isActive, isDelegated, frozen, onToggleBlock, onSetActive }) {
  return (
    <div
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
}

function SortableChapter({
  ch, isExpanded, onToggleExpand, selectedBlocks, onToggleBlock, activeBlock, onSetActive,
  delBlocks, frozen, montageEnabled, bimEnabled, onToggleMontage, onToggleBim,
  expandedProducts, onToggleProductExpand, isMultiProduct,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: ch.chapterId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 2,
  };

  const isToggleable = ch.chapterId === 'ch_montage' || ch.chapterId === 'ch_bim';
  const isEnabled = ch.chapterId === 'ch_montage' ? montageEnabled : ch.chapterId === 'ch_bim' ? bimEnabled : true;

  // Block status: check both regular blocks and product section blocks
  const allBlocks = [];
  if (ch.blocks) allBlocks.push(...ch.blocks);
  if (ch.productSections) {
    for (const sec of ch.productSections) allBlocks.push(...sec.blocks);
  }

  const blockStatus = () => {
    if (allBlocks.length === 0) return 'empty';
    const total = allBlocks.length;
    const selected = allBlocks.filter(b => selectedBlocks.has(b.id)).length;
    if (selected === total) return 'complete';
    if (selected > 0) return 'partial';
    return 'empty';
  };

  const statusColor = { complete: C.gr, partial: C.amber, empty: C.txtL }[blockStatus()];

  return (
    <div ref={setNodeRef} style={style}>
      {/* Chapter header */}
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
            fontSize: 9, fontWeight: 700, color: C.bl, background: C.blL,
            padding: '1px 5px', borderRadius: 3,
          }}>M</span>
        )}
        {isToggleable && (
          <label onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ paddingLeft: 16, paddingTop: 2 }}>
          {/* Regular blocks (shared chapters) */}
          {ch.blocks && ch.blocks.map(block => (
            <BlockItem
              key={block.id}
              block={block}
              isSelected={selectedBlocks.has(block.id)}
              isActive={activeBlock === block.id}
              isDelegated={delBlocks.has(block.id)}
              frozen={frozen}
              onToggleBlock={onToggleBlock}
              onSetActive={onSetActive}
            />
          ))}

          {/* Product sections (product-specific chapters) */}
          {ch.productSections && ch.productSections.map((section, sIdx) => {
            const subLabel = isMultiProduct ? `${ch.number}${SUB_LABELS[sIdx]}` : '';
            const productKey = `${ch.chapterId}_${section.productIndex}`;
            const isProdExpanded = expandedProducts.has(productKey);

            return (
              <div key={section.productIndex}>
                {/* Product header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    borderRadius: 3,
                    background: isProdExpanded ? '#F5F6F8' : 'transparent',
                  }}
                  onClick={() => onToggleProductExpand(productKey)}
                >
                  {isMultiProduct && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.o, minWidth: 22 }}>
                      {subLabel}
                    </span>
                  )}
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: C.dk,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {section.label}
                  </span>
                  <span style={{ fontSize: 10, color: C.txtL }}>
                    {isProdExpanded ? '▼' : '▸'}
                  </span>
                </div>

                {/* Product blocks */}
                {isProdExpanded && (
                  <div style={{ paddingLeft: isMultiProduct ? 22 : 8 }}>
                    {section.blocks.map(block => (
                      <BlockItem
                        key={block.id}
                        block={block}
                        isSelected={selectedBlocks.has(block.id)}
                        isActive={activeBlock === block.id}
                        isDelegated={delBlocks.has(block.id)}
                        frozen={frozen}
                        onToggleBlock={onToggleBlock}
                        onSetActive={onSetActive}
                      />
                    ))}
                  </div>
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
  chapters, products, selectedBlocks, activeBlock, delBlocks, frozen,
  onToggleBlock, onSetActive, onToggleDelegate,
  chapterOrder, onReorderChapters,
  montageEnabled, bimEnabled, onToggleMontage, onToggleBim,
  onAddProduct, onRemoveProduct,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isMultiProduct = products && products.length > 1;

  const [expanded, setExpanded] = useState(new Set(['ch_inleiding', 'ch_scope']));
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [showAddProduct, setShowAddProduct] = useState(false);

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProductExpand = (key) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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

  const handleRemoveProduct = (index) => {
    const product = products[index];
    if (!confirm(`Product "${product.label}" verwijderen uit deze aanvraag?`)) return;
    onRemoveProduct(index);
  };

  // Available categories for adding (exclude already selected)
  const selectedCatIds = new Set(products?.map(p => p.categoryId) || []);

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
              expandedProducts={expandedProducts}
              onToggleProductExpand={toggleProductExpand}
              isMultiProduct={isMultiProduct}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Product management */}
      <div style={{ marginTop: 16, padding: '0 8px' }}>
        {/* Product list with remove buttons */}
        {isMultiProduct && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.txtL, textTransform: 'uppercase', marginBottom: 4 }}>
              Producten
            </div>
            {products.map((p, i) => (
              <div key={p.categoryId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 6px',
                fontSize: 11,
                color: C.dk,
                borderRadius: 3,
              }}>
                <span style={{ color: C.o, fontWeight: 700, fontSize: 10, minWidth: 14 }}>
                  {SUB_LABELS[i]}
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.label}
                </span>
                {!frozen && (
                  <button
                    onClick={() => handleRemoveProduct(i)}
                    style={{
                      background: 'transparent', border: 'none', color: C.red,
                      fontSize: 12, cursor: 'pointer', padding: '0 4px',
                    }}
                    title="Product verwijderen"
                  >×</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add product */}
        {!frozen && (
          <>
            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              style={{
                width: '100%',
                padding: '6px 0',
                background: 'transparent',
                border: `1px dashed ${C.bor}`,
                borderRadius: 4,
                fontSize: 11,
                color: C.txtL,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {showAddProduct ? '− Annuleren' : '+ Product toevoegen'}
            </button>

            {showAddProduct && (
              <div style={{
                marginTop: 4,
                maxHeight: 200,
                overflow: 'auto',
                border: `1px solid ${C.bor}`,
                borderRadius: 4,
                background: C.wh,
              }}>
                {PG_GROUPS.map(g => {
                  const cats = CATEGORY_LIST.filter(c => c.pg === g.pg && !selectedCatIds.has(c.id));
                  if (cats.length === 0) return null;
                  return (
                    <div key={g.pg}>
                      <div style={{
                        padding: '4px 8px', background: C.lt, fontSize: 10, fontWeight: 700,
                        color: C.dk, borderBottom: `1px solid ${C.bor}`,
                      }}>
                        {g.pg} — {g.label}
                      </div>
                      {cats.map(cat => (
                        <div
                          key={cat.id}
                          onClick={() => { onAddProduct(cat.id); setShowAddProduct(false); }}
                          style={{
                            padding: '6px 8px 6px 16px', fontSize: 11, cursor: 'pointer',
                            color: C.dk, borderBottom: `1px solid ${C.bor}`,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FFF5F2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {cat.scope}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
