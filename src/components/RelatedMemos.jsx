import { useMemo } from 'react';
import { useApp } from '../AppContext';
import { memoTitle, formatRelative } from '../lib/text';
import { CategoryPill } from './common';

const MAX = 4;

// AI 호출 없이 태그 · 카테고리 · 제목 단어가 겹치는 정도로 관련 메모를 고른다
function score(base, other) {
  const tags = new Set(base.tags || []);
  let s = (other.tags || []).filter((t) => tags.has(t)).length * 3;
  if (base.categoryId && base.categoryId === other.categoryId) s += 1;
  const words = new Set((base.title || '').split(/\s+/).filter((w) => w.length >= 2));
  s += (other.title || '').split(/\s+/).filter((w) => words.has(w)).length * 2;
  return s;
}

export default function RelatedMemos({ memo }) {
  const { memos, categories } = useApp();
  const related = useMemo(() => memos
    .filter((m) => m.id !== memo.id)
    .map((m) => ({ m, s: score(memo, m) }))
    .filter((x) => x.s >= 2)
    .sort((a, b) => b.s - a.s)
    .slice(0, MAX)
    .map((x) => x.m), [memos, memo]);

  if (!related.length) return null;
  return (
    <section className="related">
      <h4>관련 메모</h4>
      <div className="related-list">
        {related.map((m) => (
          <a key={m.id} className="related-item" href={`#/m/${m.id}`}>
            <span className="related-title ellipsis">{memoTitle(m)}</span>
            <span className="related-meta">
              <CategoryPill category={categories.find((c) => c.id === m.categoryId)} />
              {formatRelative(m.updatedAt || m.createdAt)}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
