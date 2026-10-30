import { LayoutGrid, Rows3 } from 'lucide-react';

const KEY = 'dm-view';
export function loadView(fallback = 'board') {
  try { return localStorage.getItem(KEY) || fallback; } catch { return fallback; }
}
export function saveView(v) {
  try { localStorage.setItem(KEY, v); } catch { /* 무시 */ }
}

export default function ViewSwitch({ value, onChange }) {
  return (
    <div className="segmented" role="tablist">
      <button role="tab" aria-selected={value === 'board'} className={value === 'board' ? 'on' : ''} onClick={() => onChange('board')}>
        <LayoutGrid size={14} /> 보드
      </button>
      <button role="tab" aria-selected={value === 'list'} className={value === 'list' ? 'on' : ''} onClick={() => onChange('list')}>
        <Rows3 size={14} /> 목록
      </button>
    </div>
  );
}
