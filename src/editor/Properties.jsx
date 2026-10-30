import { useState } from 'react';
import { Check, Plus, Sparkles, X } from 'lucide-react';
import { useApp } from '../AppContext';
import { findCategoryByName } from '../lib/categories';
import { CategoryDot, CategoryPill, Popover } from '../components/common';

// 카테고리 직접 선택 / 검색 / 새로 만들기
export function CategorySelect({ value, suggestion, onChange }) {
  const { categories, ensureCategory } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const current = categories.find((c) => c.id === value);
  const q = query.trim().toLowerCase();
  const list = q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
  const canCreate = q && !findCategoryByName(categories, query);
  const suggestionDiffers = suggestion && (!current || current.name !== suggestion);

  const pick = async (id) => {
    setOpen(false);
    setQuery('');
    await onChange(id);
  };
  const pickByName = async (name) => pick(await ensureCategory(name));

  return (
    <span className="rel">
      <button className="prop-value" onClick={() => setOpen((v) => !v)}>
        <CategoryPill category={current} fallback="미분류" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="cat-pop">
        <input
          autoFocus className="pop-input" placeholder="카테고리 검색 또는 만들기" value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            if (list[0]) pick(list[0].id);
            else if (canCreate) pickByName(query);
          }}
        />
        {suggestionDiffers && !q && (
          <button className="menu-item suggest" onClick={() => pickByName(suggestion)}>
            <Sparkles size={14} /> AI 제안 <CategoryPill category={findCategoryByName(categories, suggestion) || { name: suggestion, color: 'gray' }} />
          </button>
        )}
        <div className="pop-list">
          {list.map((c) => (
            <button key={c.id} className="menu-item" onClick={() => pick(c.id)}>
              <CategoryDot color={c.color} /> <span className="ellipsis">{c.name}</span>
              {c.id === value && <Check size={14} className="ml-auto" />}
            </button>
          ))}
          <button className="menu-item" onClick={() => pick(null)}>
            <CategoryDot color="none" /> 미분류 {!value && <Check size={14} className="ml-auto" />}
          </button>
        </div>
        {canCreate && (
          <button className="menu-item" onClick={() => pickByName(query)}>
            <Plus size={14} /> ‘{query.trim()}’ 만들기
          </button>
        )}
      </Popover>
    </span>
  );
}

export function TagEditor({ tags, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const clean = draft.trim().replace(/^#/, '');
    setDraft('');
    if (!clean || tags.includes(clean)) return;
    onChange([...tags, clean]);
  };
  return (
    <div className="tag-editor">
      {tags.map((t) => (
        <span key={t} className="tag">
          #{t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`${t} 태그 삭제`}><X size={11} /></button>
        </span>
      ))}
      <input
        className="tag-input" value={draft} placeholder={tags.length ? '' : '태그 추가'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
          if (e.key === 'Backspace' && !draft && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={add}
      />
    </div>
  );
}
