import { useState, useMemo } from 'react';
import { C } from '../utils/colors.js';
import { loadAuditLog, formatAuditTime, getLastEdit } from '../utils/audit.js';

const ACTION_LABELS = {
  text_edit: 'Tekst gewijzigd',
  spec_added: 'Specificatie toegevoegd',
  spec_removed: 'Specificatie verwijderd',
  spec_changed: 'Specificatie gewijzigd',
  block_enabled: 'Blok ingeschakeld',
  block_disabled: 'Blok uitgeschakeld',
};

const ACTION_COLORS = {
  text_edit: C.bl,
  spec_added: C.gr,
  spec_removed: C.red,
  spec_changed: C.amber,
  block_enabled: C.gr,
  block_disabled: C.txtL,
};

/**
 * Inline last-edit indicator for a block.
 */
export function LastEditBadge({ blockId }) {
  const lastEdit = getLastEdit(blockId);
  if (!lastEdit) return null;

  return (
    <div style={{ fontSize: 10, color: C.txtL, marginTop: 4 }}>
      Laatst bewerkt: {lastEdit.user}, {formatAuditTime(lastEdit.timestamp)}
    </div>
  );
}

/**
 * Slide-in panel showing full audit log for a block.
 */
export default function AuditPanel({ blockId, blockLabel, onClose }) {
  const log = useMemo(() => loadAuditLog(blockId), [blockId]);

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '90vw',
      background: C.wh, boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', zIndex: 300,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${C.bor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, color: C.dk }}>Geschiedenis</h2>
          <div style={{ fontSize: 11, color: C.txtL, marginTop: 2 }}>{blockLabel}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer',
          color: C.txtL, padding: '4px 8px',
        }}>x</button>
      </div>

      {/* Log entries */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {log.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: C.txtL, fontSize: 13 }}>
            Geen wijzigingen geregistreerd voor dit blok.
          </div>
        ) : (
          log.map((entry, i) => (
            <div key={i} style={{
              padding: '10px 20px', borderBottom: `1px solid ${C.bor}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.dk }}>{entry.user}</span>
                <span style={{ fontSize: 10, color: C.txtL }}>{formatAuditTime(entry.timestamp)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: ACTION_COLORS[entry.action] || C.txtL,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: C.txt }}>
                  {ACTION_LABELS[entry.action] || entry.action}
                </span>
              </div>
              {entry.detail && (
                <div style={{
                  fontSize: 11, color: C.txtL, marginTop: 4,
                  paddingLeft: 12, fontStyle: 'italic',
                  maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {entry.detail}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
