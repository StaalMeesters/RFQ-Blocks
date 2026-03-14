import { useState, useRef, useEffect } from 'react';

const VERSIONS = [
  { version: 'v3.0', label: 'Volledig Systeem', href: null, current: true },
  { version: 'v2.0', label: 'Alleen Editor', href: '/RFQ-Blocks/v2/', current: false },
];

export default function VersionBadge() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{
      position: 'fixed',
      bottom: 12,
      left: 12,
      zIndex: 999,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          background: '#fff',
          border: '1px solid #E2E5EA',
          borderRadius: 6,
          fontSize: 11,
          color: '#888',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <span style={{ fontWeight: 700, color: '#F94816' }}>v3.0</span>
        <span style={{ fontSize: 9, color: '#bbb' }}>{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: 4,
          background: '#fff',
          border: '1px solid #E2E5EA',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          minWidth: 200,
          overflow: 'hidden',
        }}>
          {VERSIONS.map(v => (
            <a
              key={v.version}
              href={v.href || '#'}
              onClick={v.current ? (e) => { e.preventDefault(); setOpen(false); } : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                textDecoration: 'none',
                color: v.current ? '#1A1A1A' : '#555',
                fontSize: 12,
                borderBottom: '1px solid #F0F0F0',
                background: v.current ? '#FAFAFA' : 'transparent',
              }}
            >
              <span style={{
                width: 16,
                textAlign: 'center',
                color: v.current ? '#F94816' : 'transparent',
                fontWeight: 700,
                fontSize: 13,
              }}>
                {v.current ? '\u2713' : ''}
              </span>
              <span>
                <span style={{ fontWeight: 600 }}>{v.version}</span>
                <span style={{ color: '#999', marginLeft: 6 }}>{'\u2014'} {v.label}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
