import { useEffect, useState } from 'react';
import { SquarePen, GraduationCap, Ellipsis, Trash2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { navigate } from '../lib/router';
import { CATEGORY_COLORS, findCategoryByName } from '../lib/categories';
import { MemoCard, MemoRow } from './MemoCard';
import ViewSwitch, { loadView, saveView } from './ViewSwitch';
import { CategoryDot, Popover } from './common';

export default function CategoryView({ categoryId }) {
  const { memos, categories, store, toast, loaded } = useApp();
  const isNone = categoryId === 'none';
  const category = categories.find((c) => c.id === categoryId);
  const [view, setView] = useState(() => loadView());
  const [name, setName] = useState(category?.name || '');
  const [colorOpen, setColorOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setName(category?.name || ''); }, [category?.name]);

  const list = isNone
    ? memos.filter((m) => !m.categoryId || !categories.some((c) => c.id === m.categoryId))
    : memos.filter((m) => m.categoryId === categoryId);

  if (loaded && !isNone && !category) {
    return (
      <div className="page"><div className="empty"><p className="empty-title">카테고리를 찾을 수 없어요</p><a className="btn" href="#/">모든 메모로</a></div></div>
    );
  }

  const rename = async () => {
    const clean = name.trim();
    if (!category || !clean || clean === category.name) { setName(category?.name || ''); return; }
    const dup = findCategoryByName(categories, clean);
    if (dup && dup.id !== category.id) {
      toast(`‘${clean}’ 카테고리가 이미 있어요.`, { tone: 'error' });
      setName(category.name);
      return;
    }
    await store.updateCategory(category.id, { name: clean });
  };

  const remove = async () => {
    setMenuOpen(false);
    if (!confirm(`‘${category.name}’ 카테고리를 삭제할까? 안의 메모 ${list.length}개는 삭제되지 않고 미분류로 옮겨져.`)) return;
    await store.deleteCategory(category.id, list.map((m) => m.id));
    navigate('/');
  };

  const studyCount = list.filter((m) => m.study?.cards?.length).length;

  return (
    <div className="page">
      <header className="page-head">
        <div className="cat-head">
          <div className="cat-color-anchor">
            <button className="cat-color-btn" disabled={isNone} onClick={() => setColorOpen((v) => !v)} aria-label="색 바꾸기">
              <CategoryDot color={category?.color || 'none'} size={12} />
            </button>
            <Popover open={colorOpen} onClose={() => setColorOpen(false)} className="color-pop">
              {CATEGORY_COLORS.map((c) => (
                <button key={c} className={`color-swatch${category?.color === c ? ' on' : ''}`} onClick={() => { store.updateCategory(category.id, { color: c }); setColorOpen(false); }} aria-label={c}>
                  <CategoryDot color={c} size={14} />
                </button>
              ))}
            </Popover>
          </div>
          {isNone ? (
            <h1 className="page-title">미분류</h1>
          ) : (
            <input
              className="page-title title-input" value={name} aria-label="카테고리 이름"
              onChange={(e) => setName(e.target.value)} onBlur={rename}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setName(category.name); e.currentTarget.blur(); } }}
            />
          )}
        </div>
        <div className="page-actions">
          <ViewSwitch value={view} onChange={(v) => { setView(v); saveView(v); }} />
          {!isNone && (
            <button className="btn" onClick={() => navigate(`/study/c/${categoryId}`)} disabled={!studyCount} title={studyCount ? '' : '학습 카드가 있는 메모가 없어요'}>
              <GraduationCap size={15} /> 학습
            </button>
          )}
          <button className="btn btn-primary" onClick={() => navigate(isNone ? '/new' : `/new?c=${categoryId}`)}><SquarePen size={15} /> 새 메모</button>
          {!isNone && (
            <div className="rel">
              <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="더보기"><Ellipsis size={16} /></button>
              <Popover open={menuOpen} onClose={() => setMenuOpen(false)} align="right">
                <button className="menu-item danger" onClick={remove}><Trash2 size={15} /> 카테고리 삭제</button>
              </Popover>
            </div>
          )}
        </div>
      </header>
      <p className="page-sub page-sub-tight">
        메모 {list.length}개{category?.createdBy === 'ai' ? ' · AI가 만든 카테고리' : ''}
      </p>

      {!list.length ? (
        <div className="empty"><p className="empty-sub">아직 이 카테고리에 메모가 없어요.</p></div>
      ) : view === 'list' ? (
        <div className="memo-table">
          {list.map((m) => <MemoRow key={m.id} memo={m} category={category} />)}
        </div>
      ) : (
        <div className="card-grid">
          {list.map((m) => <MemoCard key={m.id} memo={m} category={category} showCategory={false} />)}
        </div>
      )}
    </div>
  );
}
