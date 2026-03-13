import { useState } from 'react';
import { C } from '../utils/colors';

export default function AddCustomSpec({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [defaultVal, setDefaultVal] = useState('');
  const [delegateText, setDelegateText] = useState('');

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd({
      id: `custom_${Date.now()}`,
      label: label.trim(),
      type,
      default: defaultVal || undefined,
      delegateText: delegateText || undefined,
      source: 'manual',
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
          marginTop: 10,
          padding: '6px 12px',
          background: 'transparent',
          border: `1px dashed ${C.bor}`,
          borderRadius: 4,
          fontSize: 11,
          color: C.txtL,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        + Add custom spec
      </button>
    );
  }

  return (
    <div style={{
      marginTop: 10,
      padding: 12,
      border: `1px dashed ${C.o}`,
      borderRadius: 6,
      background: '#fefbf8',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.dk2, marginBottom: 8, textTransform: 'uppercase' }}>
        New Custom Specification
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ fontSize: 9, color: C.txtL }}>Label *</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Min. panel weight"
            style={{ width: '100%', padding: '4px 6px', border: `1px solid ${C.bor}`, borderRadius: 3, fontSize: 11 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 9, color: C.txtL }}>Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', border: `1px solid ${C.bor}`, borderRadius: 3, fontSize: 11 }}
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="select">Select</option>
            <option value="date">Date</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 9, color: C.txtL }}>Default value</label>
          <input
            value={defaultVal}
            onChange={e => setDefaultVal(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', border: `1px solid ${C.bor}`, borderRadius: 3, fontSize: 11 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 9, color: C.txtL }}>Delegate text (optional)</label>
          <input
            value={delegateText}
            onChange={e => setDelegateText(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', border: `1px solid ${C.bor}`, borderRadius: 3, fontSize: 11 }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={() => setOpen(false)}
          style={{ padding: '4px 10px', border: `1px solid ${C.bor}`, borderRadius: 3, fontSize: 10, cursor: 'pointer', background: C.wh }}
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={!label.trim()}
          style={{
            padding: '4px 10px',
            border: 'none',
            borderRadius: 3,
            fontSize: 10,
            cursor: label.trim() ? 'pointer' : 'not-allowed',
            background: C.o,
            color: '#fff',
            fontWeight: 600,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
