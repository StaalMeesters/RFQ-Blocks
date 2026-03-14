const PREFIX = 'rfq_v2_';
const USER_KEY = `${PREFIX}audit_user`;

/**
 * Get or prompt for the audit user name.
 * Returns the stored name, or null if not set.
 */
export function getAuditUser() {
  return localStorage.getItem(USER_KEY) || null;
}

/**
 * Set the audit user name.
 */
export function setAuditUser(name) {
  localStorage.setItem(USER_KEY, name);
}

/**
 * Prompt user for their name if not already set.
 * Returns the name (existing or newly entered).
 */
export function ensureAuditUser() {
  let name = getAuditUser();
  if (!name) {
    name = prompt('Wie ben jij? (naam voor audit trail)');
    if (name && name.trim()) {
      setAuditUser(name.trim());
      return name.trim();
    }
    return null;
  }
  return name;
}

/**
 * Get the audit log key for a specific block.
 */
function auditKey(blockId) {
  return `${PREFIX}audit_${blockId}`;
}

/**
 * Load audit entries for a block.
 * Returns array of { user, timestamp, action, detail } sorted newest first.
 */
export function loadAuditLog(blockId) {
  try {
    const raw = localStorage.getItem(auditKey(blockId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/**
 * Push an audit entry for a block.
 * @param {string} blockId
 * @param {string} action - one of: text_edit, spec_added, spec_removed, spec_changed, block_enabled, block_disabled
 * @param {string} detail - human-readable description
 */
export function pushAuditEntry(blockId, action, detail) {
  const user = getAuditUser();
  if (!user) return;

  const entry = {
    user,
    timestamp: new Date().toISOString(),
    action,
    detail,
  };

  try {
    const log = loadAuditLog(blockId);
    log.unshift(entry); // newest first
    // Keep max 100 entries per block
    if (log.length > 100) log.length = 100;
    localStorage.setItem(auditKey(blockId), JSON.stringify(log));
  } catch (e) {
    console.error('Audit log write failed:', e);
  }
}

/**
 * Get the last edit info for a block (for inline display).
 * Returns { user, timestamp } or null.
 */
export function getLastEdit(blockId) {
  const log = loadAuditLog(blockId);
  return log.length > 0 ? { user: log[0].user, timestamp: log[0].timestamp } : null;
}

/**
 * Format a timestamp for display.
 */
export function formatAuditTime(isoString) {
  const d = new Date(isoString);
  const day = d.getDate();
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const month = months[d.getMonth()];
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${hours}:${mins}`;
}
