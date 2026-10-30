import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { memoTitle } from '../lib/text';
import { CategoryPill } from './common';
import PageBar from './PageBar';

// 메모 HTML에서 할 일(체크박스)을 뽑는다. 순서(index)는 문서 안 등장 순서
function extractTodos(memo) {
  if (!memo.html || !memo.html.includes('taskItem')) return [];
  const doc = new DOMParser().parseFromString(memo.html, 'text/html');
  return [...doc.querySelectorAll('li[data-type="taskItem"]')].map((li, index) => ({
    index,
    done: li.getAttribute('data-checked') === 'true',
    text: (li.querySelector(':scope > div > p, :scope > div')?.textContent || '').trim(),
  })).filter((t) => t.text);
}

function setTodoChecked(html, index, checked) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const li = doc.querySelectorAll('li[data-type="taskItem"]')[index];
  if (!li) return null;
  li.setAttribute('data-checked', String(checked));
  const box = li.querySelector(':scope > label input[type="checkbox"]');
  if (box) { if (checked) box.setAttribute('checked', 'checked'); else box.removeAttribute('checked'); }
  return doc.body.innerHTML;
}

export default function TodoView() {
  const { memos, categories, store, toast } = useApp();
  const [showDone, setShowDone] = useState(false);

  const groups = useMemo(() => memos
    .map((m) => ({ memo: m, todos: extractTodos(m) }))
    .filter((g) => g.todos.length), [memos]);

  const openCount = groups.reduce((n, g) => n + g.todos.filter((t) => !t.done).length, 0);

  const toggle = async (memo, todo) => {
    const html = setTodoChecked(memo.html, todo.index, !todo.done);
    if (!html) return;
    try {
      await store.saveMemo(memo.id, { html });
    } catch (error) {
      toast(`저장 실패: ${error.message}`, { tone: 'error' });
    }
  };

  const visible = groups
    .map((g) => ({ ...g, todos: showDone ? g.todos : g.todos.filter((t) => !t.done) }))
    .filter((g) => g.todos.length);

  return (
    <>
      <PageBar back="/" crumbs={[{ label: '모든 메모', href: '/' }, { label: '할 일' }]} />
      <div className="page page-narrow">
        <header className="page-head">
          <div>
            <h1 className="page-title">할 일</h1>
            <p className="page-sub">메모 곳곳의 체크박스를 모았어요 · 남은 할 일 {openCount}개</p>
          </div>
          <div className="segmented">
            <button className={!showDone ? 'on' : ''} onClick={() => setShowDone(false)}>남은 것</button>
            <button className={showDone ? 'on' : ''} onClick={() => setShowDone(true)}>전체</button>
          </div>
        </header>

        {!visible.length ? (
          <div className="empty">
            <p className="empty-sub">
              {groups.length ? '다 끝냈어요!' : "아직 할 일이 없어요. 메모에서 '[] + 스페이스'나 '/할 일'로 체크박스를 만들 수 있어요."}
            </p>
          </div>
        ) : (
          <div className="todo-groups">
            {visible.map(({ memo, todos }) => (
              <section key={memo.id} className="todo-group">
                <a className="todo-memo" href={`#/m/${memo.id}`}>
                  <span className="ellipsis">{memoTitle(memo)}</span>
                  <CategoryPill category={categories.find((c) => c.id === memo.categoryId)} />
                </a>
                <ul className="todo-list">
                  {todos.map((t) => (
                    <li key={t.index}>
                      <label className={`todo${t.done ? ' done' : ''}`}>
                        <input type="checkbox" checked={t.done} onChange={() => toggle(memo, t)} />
                        <span>{t.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
