import { useMemo, useState } from 'react';
import { Search, FileText, SquarePen } from 'lucide-react';
import { useApp } from '../AppContext';
import { navigate } from '../lib/router';
import { memoTitle, formatRelative } from '../lib/text';
import { CategoryDot, Modal } from './common';

export default function SearchPalette({ onClose }) {
  const { memos, categories } = useApp();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cats = q ? categories.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ type: 'cat', item: c })) : [];
    const list = q
      ? memos.filter((m) => [m.title, m.text, m.ai?.summary, ...(m.tags || [])].join(' ').toLowerCase().includes(q))
      : memos.slice(0, 8);
    return [...cats, ...list.slice(0, 30).map((m) => ({ type: 'memo', item: m }))];
  }, [query, memos, categories]);

  const catName = (id) => categories.find((c) => c.id === id)?.name;

  const go = (r) => {
    onClose();
    if (!r) { navigate('/new'); return; }
    navigate(r.type === 'cat' ? `/c/${r.item.id}` : `/m/${r.item.id}`);
  };

  return (
    <Modal onClose={onClose} className="palette" label="검색">
      <div className="palette-input">
        <Search size={16} className="muted" />
        <input
          autoFocus placeholder="메모, 요약, 태그, 카테고리 검색" value={query}
          onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
            if (e.key === 'Enter') go(results[index]);
          }}
        />
        <kbd>esc</kbd>
      </div>
      <div className="palette-list">
        {!query && <div className="palette-caption">최근 메모</div>}
        {results.map((r, i) => (
          <button key={`${r.type}-${r.item.id}`} className={`palette-item${i === index ? ' on' : ''}`} onMouseEnter={() => setIndex(i)} onClick={() => go(r)}>
            {r.type === 'cat' ? (
              <><CategoryDot color={r.item.color} /> <span className="ellipsis">{r.item.name}</span> <span className="palette-meta">카테고리</span></>
            ) : (
              <><FileText size={15} className="muted" /> <span className="ellipsis">{memoTitle(r.item)}</span>
                <span className="palette-meta">{catName(r.item.categoryId) || '미분류'} · {formatRelative(r.item.updatedAt || r.item.createdAt)}</span></>
            )}
          </button>
        ))}
        {query && !results.length && (
          <button className="palette-item on" onClick={() => go(null)}><SquarePen size={15} /> 결과가 없어요 — 새 메모 쓰기</button>
        )}
      </div>
    </Modal>
  );
}
