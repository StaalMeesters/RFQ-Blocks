import { C } from '../utils/colors';

function renderPreviewText(text, blockId, vars, vals, supVars, removedVars, altVars, originalText) {
  if (!text) return null;
  const origLines = (originalText || '').split('\n');
  const allVars = vars || [];
  const hasEdit = originalText && text !== originalText;

  return text.split('\n').map((line, i) => {
    if (line === '') return <div key={i} style={{ height: 6 }} />;

    const changed = hasEdit && origLines[i] !== line;
    const isBullet = line.startsWith('- ');
    const isNumbered = /^\d+\./.test(line);
    const content = isBullet ? line.slice(2) : line;

    const parts = content.split(/(\{\{[^}]+\}\})/g).map((p, j) => {
      const m = p.match(/^\{\{(.+)\}\}$/);
      if (!m) return <span key={j}>{p}</span>;

      const varId = m[1];
      if (removedVars?.[varId]) return null;

      const isDelegated = supVars?.[varId];
      const isAlt = altVars?.[varId];
      const val = vals?.[varId];
      const vd = allVars.find(v => v.id === varId);

      if (isDelegated) {
        return (
          <span
            key={j}
            style={{
              background: C.blL,
              color: C.bl,
              padding: '0 3px',
              borderRadius: 2,
              fontStyle: 'italic',
            }}
          >
            [{vd?.delegateText || 'By Supplier'}]
          </span>
        );
      }

      const display = val || vd?.default || varId;
      return (
        <span
          key={j}
          style={{
            background: val ? C.grL : '#FFF0EB',
            color: val ? '#1a8a4a' : C.o,
            padding: '0 3px',
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {display}
        </span>
      );
    }).filter(Boolean);

    if (!parts.length) return null;

    return (
      <div
        key={i}
        style={{
          marginBottom: 2,
          paddingLeft: isBullet || isNumbered ? 16 : (changed ? 6 : 0),
          position: 'relative',
          color: changed ? C.red : 'inherit',
          borderLeft: changed ? `2px solid ${C.red}` : 'none',
        }}
      >
        {isBullet && <span style={{ position: 'absolute', left: changed ? 8 : 0 }}>&bull;</span>}
        {parts}
      </div>
    );
  }).filter(Boolean);
}

export default function RFQPreview({
  chapters, selected, vals, supVars, delBlocks, removedVars, altVars,
  altProduct, editedTexts, getOriginalText,
}) {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: C.wh }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${C.bor}`,
        fontSize: 11,
        fontWeight: 600,
        color: C.dk,
      }}>
        RFQ Preview
      </div>
      <div style={{ padding: '14px 18px', fontSize: 11, lineHeight: 1.75 }}>
        {chapters.map(ch => {
          const activeBlocks = ch.blocks.filter(b => selected.has(b.id));
          if (!activeBlocks.length) return null;

          return (
            <div key={ch.id + ch.number}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#C52F05',
                margin: '16px 0 6px',
                paddingBottom: 3,
                borderBottom: '1.5px solid #C52F05',
              }}>
                {ch.number}. {ch.title}
              </div>
              {activeBlocks.map(bl => {
                const blockVals = vals[bl.id] || {};
                const blockSupVars = supVars[bl.id] || {};
                const blockRemoved = removedVars[bl.id] || {};
                const blockAltVars = altVars[bl.id] || {};
                const origText = getOriginalText(bl.id);

                if (delBlocks.has(bl.id)) {
                  return (
                    <div
                      key={bl.id}
                      style={{
                        color: C.bl,
                        fontStyle: 'italic',
                        padding: '6px 10px',
                        background: C.blL,
                        borderRadius: 4,
                        fontSize: 10.5,
                        marginBottom: 12,
                      }}
                    >
                      To be specified by the Supplier.
                    </div>
                  );
                }

                return (
                  <div key={bl.id} style={{ marginBottom: 12 }}>
                    <div>
                      {renderPreviewText(
                        bl.text, bl.id, bl.variables, blockVals,
                        blockSupVars, blockRemoved, blockAltVars, origText
                      )}
                    </div>
                    {/* Alt var requests */}
                    {(bl.variables || []).filter(v =>
                      blockAltVars[v.id] && !blockRemoved[v.id]
                    ).length > 0 && (
                      <div style={{
                        marginTop: 6,
                        padding: '6px 10px',
                        background: C.amberL,
                        borderRadius: 4,
                        fontSize: 10,
                        color: C.amber,
                        borderLeft: `3px solid ${C.amber}`,
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>Requested alternatives:</div>
                        {bl.variables.filter(v =>
                          blockAltVars[v.id] && !blockRemoved[v.id]
                        ).map(v => (
                          <div key={v.id} style={{ marginBottom: 2 }}>
                            &bull; {v.altText || `Alternative for ${v.label}`}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Alt product request */}
                    {altProduct[bl.id] && (
                      <div style={{
                        marginTop: 6,
                        padding: '6px 10px',
                        background: C.amberL,
                        borderRadius: 4,
                        fontSize: 10,
                        color: C.amber,
                        borderLeft: `3px solid ${C.amber}`,
                      }}>
                        <strong>Alternative product requested.</strong> The Supplier shall quote an alternative product separately with full technical details.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
