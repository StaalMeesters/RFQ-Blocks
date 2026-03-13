import { useState } from 'react';
import { C } from '../utils/colors';
import { getMasterChapters } from '../utils/mergeChapters';
import { CATEGORY_LIST, CATEGORY_DATA } from '../data/categoryRegistry';

export default function MasterEditor({ onClose }) {
  const master = getMasterChapters();
  const [activeChapter, setActiveChapter] = useState('ch1_introduction');
  const [editedTexts, setEditedTexts] = useState({});

  const chapterKeys = Object.keys(master).filter(k => k !== '_meta');
  const currentChapter = master[activeChapter];

  const handlePushToAll = (chapterKey) => {
    const count = CATEGORY_LIST.length;
    if (!confirm(`Push master ${currentChapter?.title || chapterKey} to all ${count} categories that inherit it?`)) return;
    alert(`Master chapter "${currentChapter?.title}" would be pushed to all inheriting categories. (In production, this updates localStorage for each category.)`);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: C.wh,
        borderRadius: 8,
        width: '90%',
        maxWidth: 900,
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${C.bor}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.dk, flex: 1 }}>
            Master Chapter Editor
          </span>
          <span style={{ fontSize: 10, color: C.txtL }}>
            Edit shared chapters (Ch1, Ch4, Ch5, Ch6, Ch7)
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '4px 12px',
              border: `1px solid ${C.bor}`,
              borderRadius: 4,
              background: C.wh,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Chapter list */}
          <div style={{
            width: 220,
            borderRight: `1px solid ${C.bor}`,
            overflow: 'auto',
            background: '#fafafa',
          }}>
            {chapterKeys.map(key => {
              const ch = master[key];
              const isActive = activeChapter === key;
              return (
                <div
                  key={key}
                  onClick={() => setActiveChapter(key)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: isActive ? C.blL : 'transparent',
                    borderBottom: `1px solid ${C.bor}`,
                    borderLeft: isActive ? `3px solid ${C.bl}` : '3px solid transparent',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: isActive ? 600 : 400 }}>
                    Ch{ch.number}. {ch.title}
                  </div>
                  {ch.appliesTo && (
                    <div style={{ fontSize: 9, color: C.txtL }}>
                      ({ch.appliesTo} categories)
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: C.bl }}>
                    {ch.shared ? 'Shared' : 'Category-specific'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editor */}
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {currentChapter && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, color: C.dk }}>
                    Chapter {currentChapter.number}: {currentChapter.title}
                  </h3>
                  <button
                    onClick={() => handlePushToAll(activeChapter)}
                    style={{
                      padding: '4px 12px',
                      background: C.o,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Push to all categories
                  </button>
                </div>

                {currentChapter.blocks.map(block => (
                  <div key={block.id} style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.dk2,
                      marginBottom: 4,
                      textTransform: 'uppercase',
                    }}>
                      {block.label}
                    </div>
                    <textarea
                      value={editedTexts[block.id] || block.text}
                      onChange={e => setEditedTexts(prev => ({
                        ...prev,
                        [block.id]: e.target.value,
                      }))}
                      style={{
                        width: '100%',
                        minHeight: 200,
                        padding: 10,
                        border: `1px solid ${C.bor}`,
                        borderRadius: 4,
                        fontSize: 11.5,
                        lineHeight: 1.7,
                        fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                      onFocus={e => e.target.style.borderColor = C.o}
                      onBlur={e => e.target.style.borderColor = C.bor}
                    />

                    {/* Variables */}
                    {block.variables && block.variables.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: C.dk2, textTransform: 'uppercase', marginBottom: 4 }}>
                          Variables ({block.variables.length})
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: 6,
                        }}>
                          {block.variables.map(v => (
                            <div key={v.id} style={{
                              padding: '4px 8px',
                              border: `1px solid ${C.bor}`,
                              borderRadius: 3,
                              background: '#fafafa',
                            }}>
                              <div style={{ fontSize: 8, color: C.txtL, textTransform: 'uppercase' }}>{v.label}</div>
                              <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.dk }}>
                                {'{{' + v.id + '}}'}
                              </div>
                              {v.default && (
                                <div style={{ fontSize: 9, color: C.txtL }}>Default: {v.default}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Inheritance info */}
                <div style={{
                  marginTop: 16,
                  padding: '10px 12px',
                  background: C.blL,
                  borderRadius: 4,
                  fontSize: 10,
                  color: C.bl,
                }}>
                  <strong>Inheritance:</strong> This chapter is shared across all{' '}
                  {currentChapter.appliesTo
                    ? CATEGORY_LIST.filter(c => c.scopeType === currentChapter.appliesTo).length
                    : CATEGORY_LIST.length
                  }{' '}
                  {currentChapter.appliesTo || ''} categories.
                  Categories can override with their own version.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
