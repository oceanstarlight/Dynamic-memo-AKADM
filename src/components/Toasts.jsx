import { X } from 'lucide-react';
import { useApp } from '../AppContext';
import { navigate } from '../lib/router';

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          <span>{t.message}</span>
          {t.action && (
            <button
              className="toast-action"
              onClick={() => {
                if (t.action.href) navigate(t.action.href);
                t.action.onClick?.();
                dismissToast(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button className="toast-close" onClick={() => dismissToast(t.id)} aria-label="닫기"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}
