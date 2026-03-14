import { useState } from 'react';
import { C } from '../utils/colors.js';
import entities from '../data/entities.json';
import { CATEGORY_LIST, PG_GROUPS } from '../data/categoryRegistry.js';

const entityList = [
  { id: 'stp', ...entities.stp },
  { id: 'db_bv', ...entities.db_bv },
  { id: 'db_gmbh', ...entities.db_gmbh },
  { id: 'stm_group', ...entities.stm_group },
];

export default function EntitySelector({ onStart, onGeneratorMode }) {
  const [entityId, setEntityId] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(new Set());

  const canStart = entityId && selectedCategories.size > 0;

  const toggleCategory = (catId) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleStart = () => {
    if (!canStart) return;
    onStart(entityId, [...selectedCategories]);
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: C.lt,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: C.wh,
        padding: '48px 56px',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        maxWidth: 600,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ color: C.o, fontWeight: 700, fontSize: 28 }}>STM</span>
          <span style={{ color: C.dk, fontWeight: 300, fontSize: 18, marginLeft: 4 }}>GROUP</span>
          <h2 style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 600, color: C.dk }}>
            RFQ Tekstblok Editor
          </h2>
        </div>

        {/* Step 1: Entity */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 8 }}>
            Stap 1: Selecteer STM entiteit
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entityList.map(ent => (
              <label
                key={ent.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `2px solid ${entityId === ent.id ? C.o : C.bor}`,
                  background: entityId === ent.id ? '#FFF5F2' : C.wh,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="radio"
                  name="entity"
                  value={ent.id}
                  checked={entityId === ent.id}
                  onChange={() => setEntityId(ent.id)}
                  style={{ accentColor: C.o }}
                />
                <span style={{ fontSize: 14, fontWeight: 500, color: C.dk, flex: 1 }}>
                  {ent.name}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.wh,
                  background: ent.country === 'DE' ? C.dk2 : C.o,
                  padding: '2px 8px',
                  borderRadius: 4,
                }}>
                  {ent.country}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Step 2: Multi-select categories */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 8 }}>
            Stap 2: Selecteer producten voor deze aanvraag
          </label>
          <div style={{
            border: `1px solid ${C.bor}`,
            borderRadius: 8,
            maxHeight: 340,
            overflow: 'auto',
          }}>
            {PG_GROUPS.map(g => {
              const cats = CATEGORY_LIST.filter(c => c.pg === g.pg);
              return (
                <div key={g.pg}>
                  <div style={{
                    padding: '8px 14px',
                    background: C.lt,
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.dk,
                    borderBottom: `1px solid ${C.bor}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}>
                    {g.pg} — {g.label}
                  </div>
                  {cats.map(cat => {
                    const isChecked = selectedCategories.has(cat.id);
                    return (
                      <label
                        key={cat.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 14px 8px 28px',
                          cursor: 'pointer',
                          background: isChecked ? '#FFF5F2' : 'transparent',
                          borderBottom: `1px solid ${C.bor}`,
                          transition: 'background 0.1s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat.id)}
                          style={{ accentColor: C.o, width: 15, height: 15 }}
                        />
                        <span style={{
                          fontSize: 13,
                          color: isChecked ? C.dk : C.txt,
                          fontWeight: isChecked ? 600 : 400,
                          flex: 1,
                        }}>
                          {cat.scope}
                        </span>
                        <span style={{
                          fontSize: 10,
                          color: C.txtL,
                          fontWeight: 500,
                        }}>
                          {cat.scopeType === 'service' ? 'dienst' : 'materiaal'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {selectedCategories.size > 0 && (
            <div style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 600,
              color: C.o,
            }}>
              Geselecteerd: {selectedCategories.size} product{selectedCategories.size !== 1 ? 'en' : ''}
            </div>
          )}
        </div>

        {/* Mode buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button
            disabled={!canStart}
            onClick={handleStart}
            style={{
              flex: 1,
              padding: '12px 0',
              background: canStart ? C.dk : C.bor,
              color: canStart ? C.wh : C.txtL,
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: canStart ? 'pointer' : 'default',
            }}
          >
            Start Editor
          </button>
          <button
            onClick={onGeneratorMode}
            style={{
              flex: 1,
              padding: '12px 0',
              background: C.o,
              color: C.wh,
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            RFQ Generator
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: C.txtL }}>
          Editor: bewerk en beheer tekstblokken | Generator: maak RFQ-documenten aan
        </div>
      </div>
    </div>
  );
}
