import { useEffect, useRef } from 'react';

export function CategoryDot({ color = 'gray', size = 8 }) {
  return <span className="cat-dot" data-color={color} style={{ width: size, height: size }} aria-hidden="true" />;
}

export function CategoryPill({ category, fallback = '미분류' }) {
  return (
    <span className="cat-pill" data-color={category?.color || 'gray'}>
      {category?.name || fallback}
    </span>
  );
}

// 바깥 클릭/ESC로 닫히는 팝오버
export function Popover({ open, onClose, className = '', children, align = 'left' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', onDown));
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return <div ref={ref} className={`popover popover-${align} ${className}`}>{children}</div>;
}

export function Modal({ onClose, children, className = '', label }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={label}>{children}</div>
    </div>
  );
}

export function Spinner({ size = 14 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function useCategoryMap(categories) {
  const map = new Map();
  categories.forEach((c) => map.set(c.id, c));
  return map;
}
