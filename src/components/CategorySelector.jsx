import { CATEGORY_LIST, PG_GROUPS } from '../data/categoryRegistry';
import { C } from '../utils/colors';

export default function CategorySelector({ value, onChange }) {
  const grouped = PG_GROUPS.map(g => ({
    ...g,
    categories: CATEGORY_LIST.filter(c => c.pg === g.pg),
  }));

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: C.dk2,
        color: C.o,
        border: '1px solid rgba(255,255,255,.15)',
        borderRadius: 4,
        padding: '3px 8px',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {grouped.map(g => (
        <optgroup key={g.pg} label={`${g.pg} — ${g.label}`}>
          {g.categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.pg} — {c.scope}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
