import { useState, useEffect } from 'react';
import { C } from '../utils/colors.js';
import bundledMasterData from '../data/master-chapters.json';
import { getRuntimeMasterChapters, updateRuntimeMasterChapters } from '../utils/dataLoader.js';
import { loadMasterOverrides, saveMasterOverrides } from '../utils/storage.js';
import { hasGitHubToken, saveMasterChaptersToGitHub } from '../utils/github.js';
import { showToast } from './Toast.jsx';
import { getAuditUser } from '../utils/audit.js';

// Shared chapters that can be edited via master override
const SHARED_CHAPTERS = [
  { key: 'ch_rfq_info', title: 'RFQ Informatie' },
  { key: 'ch_inleiding', title: 'Projectinleiding' },
  { key: 'ch_bim', title: 'Engineering / BIM Vereisten' },
  { key: 'ch_montage', title: 'Montage / Uitvoering' },
  { key: 'ch_planning_material', title: 'Planning & Levering' },
  { key: 'ch_planning_service', title: 'Planning & Uitvoering' },
  { key: 'ch_financieel', title: 'Commerciële Voorwaarden' },
  { key: 'ch_offerte', title: 'Offerte Vereisten' },
  { key: 'ch_bijlagen', title: 'Bijlagen' },
];

export default function MasterChapterModal({ onClose }) {
  const [overrides, setOverrides] = useState({});
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [editingBlockIdx, setEditingBlockIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOverrides(loadMasterOverrides());
  }, []);

  const getChapterData = (key) => {
    const masterData = getRuntimeMasterChapters() || bundledMasterData;
    const original = masterData[key];
    if (!original) return null;
    const override = overrides[key];
    if (!override) return original;
    // Merge: override block texts onto original structure
    const merged = JSON.parse(JSON.stringify(original));
    if (override.blocks) {
      for (const [blockId, text] of Object.entries(override.blocks)) {
        const block = merged.blocks?.find(b => b.id === blockId);
        if (block) block.text = text;
      }
    }
    return merged;
  };

  const hasOverride = (key) => !!overrides[key];

  const handleEditBlock = (chKey, blockIdx) => {
    const ch = getChapterData(chKey);
    if (!ch?.blocks?.[blockIdx]) return;
    setEditingBlockIdx(blockIdx);
    setEditText(ch.blocks[blockIdx].text);
  };

  const handleSaveBlock = async () => {
    if (!selectedChapter || editingBlockIdx === null) return;
    const ch = getChapterData(selectedChapter);
    const block = ch.blocks[editingBlockIdx];
    const newOverrides = { ...overrides };
    if (!newOverrides[selectedChapter]) newOverrides[selectedChapter] = { blocks: {} };
    newOverrides[selectedChapter].blocks[block.id] = editText;
    setOverrides(newOverrides);
    saveMasterOverrides(newOverrides);
    setEditingBlockIdx(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Also save to GitHub if token configured
    if (hasGitHubToken()) {
      const masterData = getRuntimeMasterChapters() || bundledMasterData;
      // Apply overrides to produce final master data
      const updatedMaster = JSON.parse(JSON.stringify(masterData));
      for (const [chKey, chOverrides] of Object.entries(newOverrides)) {
        if (chOverrides.blocks && updatedMaster[chKey]) {
          for (const [blockId, text] of Object.entries(chOverrides.blocks)) {
            const b = updatedMaster[chKey].blocks?.find(bl => bl.id === blockId);
            if (b) b.text = text;
          }
        }
      }
      const userName = getAuditUser() || 'onbekend';
      const chTitle = SHARED_CHAPTERS.find(c => c.key === selectedChapter)?.title || selectedChapter;
      const result = await saveMasterChaptersToGitHub(updatedMaster, userName, `${chTitle} — ${block.label}`);
      if (result.ok) {
        updateRuntimeMasterChapters(updatedMaster);
        showToast('Master-hoofdstuk opgeslagen in GitHub \u2713', 'success');
      } else {
        showToast(`GitHub opslaan mislukt: ${result.error}`, 'error', 6000);
      }
    }
  };

  const handleResetChapter = (key) => {
    if (!confirm(`Hoofdstuk "${SHARED_CHAPTERS.find(c => c.key === key)?.title}" terugzetten naar standaard?`)) return;
    const newOverrides = { ...overrides };
    delete newOverrides[key];
    setOverrides(newOverrides);
    saveMasterOverrides(newOverrides);
  };

  const handleResetAll = () => {
    if (!confirm('Alle master-hoofdstukken terugzetten naar standaardteksten?')) return;
    setOverrides({});
    saveMasterOverrides({});
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
    }} onClick={onClose}>
      <div style={{
        background: C.wh, borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        width: 800, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.bor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, color: C.dk }}>Hoofdstukken beheren</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.txtL }}>
              Bewerk master-teksten. Wijzigingen gelden voor alle nieuwe RFQ's.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && <span style={{ fontSize: 11, color: C.gr, fontWeight: 600 }}>Opgeslagen</span>}
            <button onClick={handleResetAll} style={{
              padding: '4px 10px', background: 'transparent', border: `1px solid ${C.bor}`,
              borderRadius: 4, fontSize: 11, cursor: 'pointer', color: C.red,
            }}>Alles terugzetten</button>
            <button onClick={onClose} style={{
              padding: '4px 10px', background: C.dk, color: C.wh, border: 'none',
              borderRadius: 4, fontSize: 12, cursor: 'pointer',
            }}>Sluiten</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Chapter list */}
          <div style={{
            width: 240, borderRight: `1px solid ${C.bor}`, overflow: 'auto',
          }}>
            {SHARED_CHAPTERS.map(ch => {
              const isSelected = selectedChapter === ch.key;
              const modified = hasOverride(ch.key);
              return (
                <div
                  key={ch.key}
                  onClick={() => { setSelectedChapter(ch.key); setEditingBlockIdx(null); }}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                    background: isSelected ? C.lt : 'transparent',
                    borderLeft: isSelected ? `3px solid ${C.o}` : '3px solid transparent',
                    display: 'flex', alignItems: 'center', gap: 6,
                    borderBottom: `1px solid ${C.bor}`,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8f8f8'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400, color: C.dk }}>{ch.title}</span>
                  {modified && (
                    <span style={{
                      fontSize: 9, padding: '1px 5px', borderRadius: 3,
                      background: C.amberL, color: C.amber, fontWeight: 700,
                    }}>gewijzigd</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chapter detail */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
            {!selectedChapter ? (
              <div style={{ color: C.txtL, fontSize: 13, fontStyle: 'italic', padding: 20 }}>
                Selecteer een hoofdstuk om de master-tekst te bekijken of bewerken.
              </div>
            ) : (
              <ChapterDetail
                chapterKey={selectedChapter}
                chapterData={getChapterData(selectedChapter)}
                isModified={hasOverride(selectedChapter)}
                editingBlockIdx={editingBlockIdx}
                editText={editText}
                onEditBlock={(idx) => handleEditBlock(selectedChapter, idx)}
                onChangeText={setEditText}
                onSaveBlock={handleSaveBlock}
                onCancelEdit={() => setEditingBlockIdx(null)}
                onResetChapter={() => handleResetChapter(selectedChapter)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChapterDetail({
  chapterKey, chapterData, isModified,
  editingBlockIdx, editText, onEditBlock, onChangeText, onSaveBlock, onCancelEdit,
  onResetChapter,
}) {
  if (!chapterData) {
    return <div style={{ color: C.txtL, fontSize: 13 }}>Hoofdstuk niet gevonden.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: C.dk, flex: 1 }}>{chapterData.title}</h3>
        {isModified && (
          <button onClick={onResetChapter} style={{
            padding: '4px 10px', background: 'transparent', border: `1px solid ${C.bor}`,
            borderRadius: 4, fontSize: 11, cursor: 'pointer', color: C.amber,
          }}>Terugzetten naar standaard</button>
        )}
      </div>

      {chapterData.blocks?.map((block, idx) => (
        <div key={block.id} style={{
          marginBottom: 16, border: `1px solid ${C.bor}`, borderRadius: 6, overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 12px', background: C.lt, borderBottom: `1px solid ${C.bor}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.dk, flex: 1 }}>{block.label}</span>
            {editingBlockIdx !== idx && (
              <button onClick={() => onEditBlock(idx)} style={{
                padding: '3px 10px', background: C.o, color: C.wh, border: 'none',
                borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 600,
              }}>Bewerken</button>
            )}
          </div>

          {editingBlockIdx === idx ? (
            <div style={{ padding: 12 }}>
              <textarea
                value={editText}
                onChange={e => onChangeText(e.target.value)}
                style={{
                  width: '100%', minHeight: 200, padding: 10, border: `1px solid ${C.bor}`,
                  borderRadius: 4, fontSize: 12, fontFamily: "'Segoe UI', system-ui, sans-serif",
                  lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 10, color: C.txtL, margin: '6px 0 10px' }}>
                Variabelen: {'{{variabelNaam}}'} — deze worden automatisch ingevuld.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={onCancelEdit} style={{
                  padding: '5px 14px', background: 'transparent', border: `1px solid ${C.bor}`,
                  borderRadius: 4, fontSize: 12, cursor: 'pointer', color: C.dk,
                }}>Annuleren</button>
                <button onClick={onSaveBlock} style={{
                  padding: '5px 14px', background: C.o, color: C.wh, border: 'none',
                  borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Opslaan</button>
              </div>
            </div>
          ) : (
            <div style={{
              padding: 12, fontSize: 12, color: C.txt, lineHeight: 1.7, whiteSpace: 'pre-wrap',
              maxHeight: 200, overflow: 'auto',
            }}>
              {block.text}
            </div>
          )}

          {block.variables?.length > 0 && editingBlockIdx !== idx && (
            <div style={{
              padding: '6px 12px', borderTop: `1px solid ${C.bor}`, background: '#fafbfc',
            }}>
              <span style={{ fontSize: 10, color: C.txtL }}>
                Variabelen: {block.variables.map(v => v.label).join(', ')}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
