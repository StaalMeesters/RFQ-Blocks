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

export default function EntitySelector({ onStart }) {
  const [entityId, setEntityId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const canStart = entityId && categoryId;

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
        maxWidth: 520,
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ color: C.o, fontWeight: 700, fontSize: 28 }}>STM</span>
          <span style={{ color: C.dk, fontWeight: 300, fontSize: 18, marginLeft: 4 }}>GROUP</span>
          <h2 style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 600, color: C.dk }}>
            RFQ Tekstblok Editor
          </h2>
        </div>

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

        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 8 }}>
            Stap 2: Selecteer productcategorie
          </label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 6,
              border: `1px solid ${C.bor}`,
              fontSize: 14,
              color: C.dk,
              background: C.wh,
            }}
          >
            <option value="">— Selecteer categorie —</option>
            {PG_GROUPS.map(g => (
              <optgroup key={g.pg} label={`${g.pg} — ${g.label}`}>
                {CATEGORY_LIST.filter(c => c.pg === g.pg).map(c => (
                  <option key={c.id} value={c.id}>{c.scope}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <button
          disabled={!canStart}
          onClick={() => onStart(entityId, categoryId)}
          style={{
            width: '100%',
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
          Start Editor →
        </button>
      </div>
    </div>
  );
}
