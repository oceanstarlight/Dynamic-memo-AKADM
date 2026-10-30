import { useMemo, useState } from 'react';
import { SquarePen, ChevronRight, FileUp } from 'lucide-react';
import { useApp } from '../AppContext';
import { navigate, openImport } from '../lib/router';
import { MemoCard, MemoRow } from './MemoCard';
import ViewSwitch, { loadView, saveView } from './ViewSwitch';
import ThemeToggle from './ThemeToggle';
import { CategoryDot, useCategoryMap } from './common';

const PER_SECTION = 6;

export default function HomeView() {
  const { memos, categories, loaded, session, isGuest } = useApp();
  const [view, setView] = useState(() => loadView());
  const [tag, setTag] = useState(null);
  const catMap = useCategoryMap(categories);

  const changeView = (v) => { setView(v); saveView(v); };

  const tagCounts = useMemo(() => {
    const counts = new Map();
    memos.forEach((m) => (m.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [memos]);

  const visible = tag ? memos.filter((m) => (m.tags || []).includes(tag)) : memos;

  const sections = useMemo(() => {
    const groups = categories.map((c) => ({ category: c, memos: visible.filter((m) => m.categoryId === c.id) }));
    const none = visible.filter((m) => !m.categoryId || !catMap.has(m.categoryId));
    if (none.length) groups.push({ category: null, memos: none });
    return groups.filter((g) => g.memos.length);
  }, [categories, visible, catMap]);

  const firstName = isGuest ? '' : (session.user.displayName || '').split(' ')[0];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">모든 메모</h1>
          <p className="page-sub">
            {firstName ? `${firstName}님, ` : ''}메모 {memos.length}개 · 카테고리 {categories.length}개
          </p>
        </div>
        <div className="page-actions">
          <ThemeToggle />
          <ViewSwitch value={view} onChange={changeView} />
          <button className="btn" onClick={openImport}><FileUp size={15} /> 불러오기</button>
          <button className="btn btn-primary" onClick={() => navigate('/new')}><SquarePen size={15} /> 새 메모</button>
        </div>
      </header>

      {tagCounts.length > 0 && (
        <div className="chip-row">
          {tagCounts.map(([t, n]) => (
            <button key={t} className={`chip${tag === t ? ' on' : ''}`} onClick={() => setTag(tag === t ? null : t)}>
              #{t} <span className="chip-n">{n}</span>
            </button>
          ))}
        </div>
      )}

      {!loaded ? (
        <div className="skeleton-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" />)}</div>
      ) : !memos.length ? (
        <EmptyState />
      ) : view === 'list' ? (
        <div className="memo-table">
          <div className="memo-row memo-row-head">
            <span>제목</span><span>요약</span><span>카테고리</span><span>태그</span><span>수정</span>
          </div>
          {visible.map((m) => <MemoRow key={m.id} memo={m} category={catMap.get(m.categoryId)} />)}
        </div>
      ) : (
        sections.map(({ category, memos: list }) => (
          <section key={category?.id || 'none'} className="board-section">
            <a className="board-head" href={`#/c/${category?.id || 'none'}`}>
              <CategoryDot color={category?.color || 'none'} size={9} />
              <h2>{category?.name || '미분류'}</h2>
              <span className="board-count">{list.length}</span>
              <ChevronRight size={15} className="board-more" />
            </a>
            <div className="card-grid">
              {list.slice(0, PER_SECTION).map((m) => <MemoCard key={m.id} memo={m} category={category} showCategory={false} />)}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty">
      <p className="empty-title">아직 메모가 없어요</p>
      <p className="empty-sub">생각나는 대로 적고 <b>작성 완료</b>를 누르면, 카테고리와 요약은 알아서 정리돼요.</p>
      <div className="page-actions">
        <button className="btn" onClick={openImport}><FileUp size={15} /> txt · md 불러오기</button>
        <button className="btn btn-primary" onClick={() => navigate('/new')}><SquarePen size={15} /> 첫 메모 쓰기</button>
      </div>
    </div>
  );
}
