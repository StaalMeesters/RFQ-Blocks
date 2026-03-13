import { useState } from 'react';
import { C } from '../utils/colors.js';

export default function AddCustomSpec({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [defaultVal, setDefaultVal] = useState('');
  const [delegateText, setDelegateText] = useState('');

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd({
      label: label.trim(),
      type,
      default: defaultVal,
      delegateText: delegateText || `De Leverancier dient een voorstel te doen voor ${label.trim()} en conformiteit met de gestelde eisen te bevestigen.`,
      source: 'custom',
    });
    setLabel('');
    setType('text');
    setDefaultVal('');
    setDelegateText('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: 12,
          padding: '6px 12px',
          background: 'transparent',
          color: C.o,
          border: `1px dashed ${C.o}`,
          borderRadius: 4,
          fontSize: 12,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        + Specificatie toevoegen
      </button>
    );
  }

  return (
    <div style={{
      marginTop: 12,
      padding: '12px',
      border: `1px solid ${C.bor}`,
      borderRadius: 6,
      background: C.lt,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ fontSize: 10, color: C.txtL, display: 'block', marginBottom: 2 }}>Label</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Bijv. Brandklasse"
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: `1px solid ${C.bor}`, fontSize: 12 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, color: C.txtL, display: 'block', marginBottom: 2 }}>Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: `1px solid ${C.bor}`, fontSize: 12 }}
          >
            <option value="text">Tekst</option>
            <option value="number">Nummer</option>
            <option value="select">Selectie</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 10, color: C.txtL, display: 'block', marginBottom: 2 }}>Standaardwaarde</label>
        <input
          value={defaultVal}
          onChange={e => setDefaultVal(e.target.value)}
          style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: `1px solid ${C.bor}`, fontSize: 12 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleAdd} style={{
          padding: '5px 14px', background: C.o, color: C.wh, border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          Toevoegen
        </button>
        <button onClick={() => setOpen(false)} style={{
          padding: '5px 14px', background: 'transparent', color: C.txtL, border: `1px solid ${C.bor}`, borderRadius: 4, fontSize: 12, cursor: 'pointer',
        }}>
          Annuleren
        </button>
      </div>
    </div>
  );
}
