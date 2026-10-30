import { useApp } from '../AppContext';
import { formatRelative, memoTitle } from '../lib/text';
import { CategoryPill, Spinner } from './common';

function snippet(memo) {
  if (memo.ai?.summary) return memo.ai.summary;
  return (memo.text || '').trim().slice(0, 160);
}

export function MemoCard({ memo, category, showCategory = true }) {
  const { busy } = useApp();
  const working = busy[memo.id];
  return (
    <a className="memo-card" href={`#/m/${memo.id}`}>
      <div className="memo-card-title">{memoTitle(memo)}</div>
      <p className="memo-card-body">{snippet(memo) || <span className="muted">내용 없음</span>}</p>
      <div className="memo-card-meta">
        {showCategory && <CategoryPill category={category} />}
        {memo.status === 'draft' && <span className="meta-flag">작성 중</span>}
        {working && <span className="meta-flag"><Spinner size={10} /> {working === 'study' ? '카드 생성' : 'AI 정리'}</span>}
        <span className="meta-date">{formatRelative(memo.updatedAt || memo.createdAt)}</span>
      </div>
    </a>
  );
}

export function MemoRow({ memo, category }) {
  return (
    <a className="memo-row" href={`#/m/${memo.id}`}>
      <span className="memo-row-title ellipsis">{memoTitle(memo)}</span>
      <span className="memo-row-summary ellipsis">{memo.ai?.summary || (memo.text || '').slice(0, 120)}</span>
      <span className="memo-row-cat"><CategoryPill category={category} /></span>
      <span className="memo-row-tags ellipsis">{(memo.tags || []).slice(0, 3).map((t) => `#${t}`).join(' ')}</span>
      <span className="memo-row-date">{formatRelative(memo.updatedAt || memo.createdAt)}</span>
    </a>
  );
}
