import { C } from '../utils/colors';

export default function LeftPanel({
  chapters, selected, activeBlock, editedTexts, delBlocks, altProduct,
  onToggleBlock, onSelectBlock, frozen,
}) {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: C.wh }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${C.bor}`,
        fontSize: 10,
        fontWeight: 700,
        color: C.dk2,
        textTransform: 'uppercase',
        letterSpacing: .4,
      }}>
        Chapters &amp; Blocks
      </div>
      {chapters.map(ch => {
        const selectedCount = ch.blocks.filter(b => selected.has(b.id)).length;
        return (
          <div key={ch.id + ch.number}>
            <div style={{
              padding: '6px 10px',
              background: '#f7f8fa',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderBottom: `1px solid ${C.bor}`,
            }}>
              <span style={{
                background: C.o,
                color: '#fff',
                fontSize: 9,
                fontWeight: 700,
                borderRadius: 2,
                padding: '1px 4px',
              }}>{ch.number}</span>
              <span style={{ flex: 1, fontWeight: 500, fontSize: 11.5 }}>{ch.title}</span>
              {ch.shared && (
                <span style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: C.bl,
                  background: C.blL,
                  padding: '0 3px',
                  borderRadius: 2,
                }} title="Inherited from master">M</span>
              )}
              <span style={{ fontSize: 9, color: C.txtL }}>{selectedCount}/{ch.blocks.length}</span>
            </div>
            {ch.blocks.map(bl => {
              const isOn = selected.has(bl.id);
              const isActive = activeBlock === bl.id;
              const isDelegated = delBlocks.has(bl.id);
              const isEdited = editedTexts[bl.id] !== undefined;
              const isAlt = altProduct[bl.id];
              return (
                <div
                  key={bl.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '5px 8px 5px 18px',
                    gap: 5,
                    background: isActive ? C.blL : 'transparent',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${C.bor}`,
                  }}
                >
                  <div
                    onClick={() => !frozen && onToggleBlock(bl.id)}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 2,
                      border: `1.5px solid ${isOn ? C.o : C.bor}`,
                      background: isOn ? C.o : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 9,
                      flexShrink: 0,
                      cursor: frozen ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isOn ? '\u2713' : ''}
                  </div>
                  <span
                    onClick={() => onSelectBlock(bl.id)}
                    style={{
                      flex: 1,
                      fontSize: 11,
                      fontWeight: isActive ? 600 : 400,
                      color: isDelegated ? C.bl : isEdited ? C.red : C.txt,
                      fontStyle: isDelegated ? 'italic' : 'normal',
                    }}
                  >
                    {bl.label}
                  </span>
                  {isEdited && (
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: C.red, flexShrink: 0 }} />
                  )}
                  {isAlt && (
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: C.amber, flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
