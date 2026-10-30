import { useEffect, useState } from 'react';
import { SquarePen, GraduationCap, Ellipsis, Trash2, Download, BookText, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../AppContext';
import { navigate } from '../lib/router';
import { CATEGORY_COLORS, findCategoryByName } from '../lib/categories';
import { categoryOverview } from '../lib/gemini';
import { downloadMemosZip } from '../lib/exportMd';
import { formatRelative, hashText } from '../lib/text';
import { sanitizeHtml } from '../editor/extensions';
import { MemoCard, MemoRow } from './MemoCard';
import ViewSwitch, { loadView, saveView } from './ViewSwitch';
import { CategoryDot, Popover, Spinner } from './common';
import PageBar from './PageBar';

const overviewHash = (list) => hashText(list.map((m) => `${m.id}:${hashText(m.text || '')}`).join('|'));

export default function CategoryView({ categoryId }) {
  const { memos, categories, store, toast, loaded, settings } = useApp();
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
  const title = isNone ? '미분류' : (category?.name || '카테고리');

  if (loaded && !isNone && !category) {
    return (
      <>
        <PageBar back="/" crumbs={[{ label: '모든 메모', href: '/' }, { label: '없는 카테고리' }]} />
        <div className="page"><div className="empty"><p className="empty-title">카테고리를 찾을 수 없어요</p></div></div>
      </>
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
    if (!confirm(`‘${category.name}’ 카테고리를 삭제할까요? 안의 메모 ${list.length}개는 삭제되지 않고 미분류로 옮겨집니다.`)) return;
    await store.deleteCategory(category.id, list.map((m) => m.id));
    navigate('/');
  };

  const exportZip = () => {
    setMenuOpen(false);
    if (!list.length) { toast('내보낼 메모가 없어요.'); return; }
    downloadMemosZip(list, title);
  };

  const studyCount = list.filter((m) => m.study?.cards?.length).length;

  return (
    <>
      <PageBar back="/" crumbs={[{ label: '모든 메모', href: '/' }, { label: title }]}>
        <div className="rel">
          <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="더보기"><Ellipsis size={16} /></button>
          <Popover open={menuOpen} onClose={() => setMenuOpen(false)} align="right">
            <button className="menu-item" onClick={exportZip}><Download size={15} /> md로 내보내기 (.zip)</button>
            {!isNone && <button className="menu-item danger" onClick={remove}><Trash2 size={15} /> 카테고리 삭제</button>}
          </Popover>
        </div>
      </PageBar>
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
          </div>
        </header>
        <p className="page-sub page-sub-tight">
          메모 {list.length}개{category?.createdBy === 'ai' ? ' · AI가 만든 카테고리' : ''}
        </p>

        {!isNone && settings.categoryOverview && list.length >= 2 && <Overview category={category} list={list} />}

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
    </>
  );
}

// 카테고리 개요 노트: 누를 때만 Gemini 호출, 결과는 카테고리 문서에 저장
function Overview({ category, list }) {
  const { store, toast } = useApp();
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const overview = category.overview;
  const stale = overview && overview.sourceHash !== overviewHash(list);

  const run = async () => {
    setRunning(true);
    try {
      // 본문 대신 요약 · 핵심 위주로 보낸다 (개수 · 글자 예산은 categoryOverview에서 제한)
      const memos = list.map((m) => ({ title: m.title, summary: m.ai?.summary, keyPoints: m.ai?.keyPoints, text: m.text }));
      const result = await categoryOverview({ name: category.name, memos });
      // 스키마로 정제한 HTML만 저장
      await store.updateCategory(category.id, {
        overview: { html: sanitizeHtml(result.html), gaps: result.gaps, sourceHash: overviewHash(list), memoCount: list.length, createdAt: Date.now() },
      });
      setExpanded(true);
    } catch (error) {
      toast(`개요를 만들지 못했어요: ${error.message}`, { tone: 'error' });
    } finally {
      setRunning(false);
    }
  };

  if (!overview && !running) {
    return (
      <div className="overview overview-empty">
        <BookText size={16} className="muted" />
        <span>메모 {list.length}개를 한 장으로 정리한 개요 노트를 만들 수 있어요.</span>
        <button className="btn btn-sm" onClick={run}>개요 만들기</button>
      </div>
    );
  }

  return (
    <section className="overview">
      <div className="overview-head">
        <button className="overview-toggle" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          <BookText size={15} /> 개요 노트
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <span className="overview-meta">
          {running || !overview
            ? <><Spinner size={11} /> 정리 중…</>
            : `${formatRelative(overview.createdAt)} · 메모 ${overview.memoCount}개 기준${stale ? ' · 이후 바뀐 메모 있음' : ''}`}
        </span>
        {/* 바뀐 메모가 없으면 다시 만들 필요가 없으므로 버튼을 막는다 */}
        <button className="btn btn-sm btn-ghost" onClick={run} disabled={running || !stale} title={stale ? '' : '바뀐 메모가 없어요'}>
          <RefreshCw size={13} /> {stale ? '다시' : '최신'}
        </button>
      </div>
      {expanded && overview && (
        <>
          {/* 저장 전에 sanitizeHtml로 에디터 스키마에 맞게 정제한 HTML이라 그대로 그린다 */}
          <div className="prose prose-sm overview-body" dangerouslySetInnerHTML={{ __html: overview.html }} />
          {overview?.gaps?.length > 0 && (
            <div className="overview-gaps">
              <span>더 적어 보면 좋을 것</span>
              <ul>{overview.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
