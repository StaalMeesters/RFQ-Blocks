import { useState, useEffect, useCallback, useRef } from 'react';

let toastListener = null;

/**
 * Show a toast notification. Call from anywhere.
 * @param {string} message
 * @param {'success'|'error'|'warning'} type
 * @param {number} duration - ms, default 4000
 */
export function showToast(message, type = 'success', duration = 4000) {
  if (toastListener) {
    toastListener({ message, type, duration, id: Date.now() });
  }
}

const COLORS = {
  success: { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
  error: { bg: '#FFEBEE', border: '#F44336', text: '#C62828' },
  warning: { bg: '#FFF8E1', border: '#FFA000', text: '#E65100' },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev, toast]);
    timers.current[toast.id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
      delete timers.current[toast.id];
    }, toast.duration);
  }, []);

  useEffect(() => {
    toastListener = addToast;
    return () => { toastListener = null; };
  }, [addToast]);

  useEffect(() => {
    return () => {
      for (const t of Object.values(timers.current)) clearTimeout(t);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxWidth: 400,
    }}>
      {toasts.map(t => {
        const c = COLORS[t.type] || COLORS.success;
        return (
          <div
            key={t.id}
            style={{
              padding: '10px 16px',
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 6,
              color: c.text,
              fontSize: 13,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
              animation: 'toast-in 0.2s ease-out',
              cursor: 'pointer',
            }}
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          >
            {t.message}
          </div>
        );
      })}
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}
