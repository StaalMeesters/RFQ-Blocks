import { C } from '../utils/colors.js';

export default function RFQPreview({
  chapters, selectedBlocks, vals, editedTexts,
  delBlocks, removedVars, altVars, altProduct,
  getOriginalText, entityId,
}) {
  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '16px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      background: C.wh,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.txtL, textTransform: 'uppercase', marginBottom: 12 }}>
        RFQ Voorbeeld
      </div>

      {chapters.map(ch => {
        const activeBlocks = (ch.blocks || []).filter(b => selectedBlocks.has(b.id));
        if (activeBlocks.length === 0) return null;

        return (
          <div key={ch.chapterId} style={{ marginBottom: 20 }}>
            {/* Chapter heading — René's style */}
            <h3 style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.heading,
              margin: '0 0 8px',
              paddingBottom: 4,
              borderBottom: `2px solid ${C.heading}`,
            }}>
              {ch.number}. {ch.title}
            </h3>

            {activeBlocks.map(block => {
              const isDelegated = delBlocks.has(block.id);
              const isEdited = editedTexts[block.id] !== undefined;
              const text = editedTexts[block.id] ?? block.text;

              return (
                <div
                  key={block.id}
                  style={{
                    marginBottom: 12,
                    ...(isEdited && { borderLeft: `3px solid ${C.red}`, paddingLeft: 10 }),
                    ...(isDelegated && { borderLeft: `3px solid ${C.bl}`, paddingLeft: 10, fontStyle: 'italic' }),
                  }}
                >
                  {renderPreviewText(text, block.variables || [], vals, removedVars, altVars, isDelegated)}

                  {/* Alt product section */}
                  {altProduct && (
                    <div style={{
                      marginTop: 8,
                      padding: '8px 10px',
                      background: C.amberL,
                      borderRadius: 4,
                      fontSize: 12,
                      color: C.amber,
                      fontStyle: 'italic',
                    }}>
                      De Leverancier dient aanvullend een alternatief product aan te bieden en het verschil in prijs en technische prestatie aan te geven.
                    </div>
                  )}

                  {/* Alt vars */}
                  {block.variables?.filter(v => altVars.has(v.id) && v.altText).map(v => (
                    <div key={v.id} style={{
                      marginTop: 4,
                      padding: '6px 10px',
                      background: C.amberL,
                      borderRadius: 4,
                      fontSize: 11,
                      color: C.amber,
                      fontStyle: 'italic',
                    }}>
                      {v.altText}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderPreviewText(text, variables, vals, removedVars, altVars, isDelegated) {
  if (!text) return null;
  const varMap = {};
  for (const v of variables) {
    varMap[v.id] = v;
  }

  // Split by {{varId}} patterns
  const parts = [];
  let lastIndex = 0;
  const regex = /\{\{(\w+)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const varId = match[1];
    const v = varMap[varId];
    if (v && !removedVars.has(varId)) {
      const value = vals[varId] || v.default || '';
      const isFilled = !!value;
      parts.push({
        type: 'var',
        varId,
        value: value || v.label,
        isFilled,
        isDelegated,
      });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return (
    <div style={{ fontSize: 13, lineHeight: 1.7, color: C.txt, whiteSpace: 'pre-wrap' }}>
      {parts.map((p, i) => {
        if (p.type === 'text') return <span key={i}>{p.content}</span>;
        const color = p.isDelegated ? C.bl : p.isFilled ? C.gr : C.o;
        const bg = p.isDelegated ? C.blL : p.isFilled ? C.grL : '#FFF5F2';
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              padding: '0px 6px',
              margin: '0 1px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              background: bg,
              color: color,
              border: `1px solid ${color}`,
            }}
          >
            {p.value}
          </span>
        );
      })}
    </div>
  );
}
