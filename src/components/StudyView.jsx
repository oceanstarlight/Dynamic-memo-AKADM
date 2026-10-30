import { useEffect, useMemo, useState } from 'react';
import { Shuffle, RotateCcw, GraduationCap } from 'lucide-react';
import { useApp } from '../AppContext';
import { memoTitle } from '../lib/text';
import { CategoryDot, Spinner } from './common';
import PageBar from './PageBar';

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function StudyView({ scope, targetId }) {
  const { memos, categories, loaded } = useApp();

  if (!scope) return <StudyHome />;
  if (!loaded) return <><PageBar back="/study" crumbs={[{ label: '학습', href: '/study' }]} /><div className="page"><Spinner /></div></>;

  const sourceMemos = scope === 'm'
    ? memos.filter((m) => m.id === targetId)
    : memos.filter((m) => m.categoryId === targetId);
  const withStudy = sourceMemos.filter((m) => m.study?.cards?.length || m.study?.quiz?.length);
  const title = scope === 'm'
    ? memoTitle(sourceMemos[0])
    : categories.find((c) => c.id === targetId)?.name || '카테고리';
  const back = scope === 'm' ? `/m/${targetId}` : `/c/${targetId}`;

  const cards = withStudy.flatMap((m) => (m.study.cards || []).map((c) => ({ ...c, memo: memoTitle(m) })));
  const quiz = withStudy.flatMap((m) => (m.study.quiz || []).map((q) => ({ ...q, memo: memoTitle(m) })));

  return (
    <>
      <PageBar back={back} crumbs={[{ label: '학습', href: '/study' }, { label: title, href: back }, { label: '복습' }]} />
      <div className="page page-narrow">
        <StudySession key={`${scope}-${targetId}`} title={title} cards={cards} quiz={quiz} multi={scope === 'c'} />
      </div>
    </>
  );
}

function StudySession({ title, cards, quiz, multi }) {
  const [mode, setMode] = useState(cards.length ? 'cards' : 'quiz');
  if (!cards.length && !quiz.length) {
    return <div className="empty"><p className="empty-title">학습 카드가 없어요</p><p className="empty-sub">메모 오른쪽 도구의 ‘학습 카드’에서 만들 수 있어요.</p></div>;
  }
  return (
    <>
      <header className="study-head">
        <h1 className="page-title">{title}</h1>
        <div className="segmented">
          <button className={mode === 'cards' ? 'on' : ''} onClick={() => setMode('cards')} disabled={!cards.length}>플래시카드 {cards.length}</button>
          <button className={mode === 'quiz' ? 'on' : ''} onClick={() => setMode('quiz')} disabled={!quiz.length}>퀴즈 {quiz.length}</button>
        </div>
      </header>
      {mode === 'cards' ? <Flashcards cards={cards} multi={multi} /> : <Quiz questions={quiz} multi={multi} />}
    </>
  );
}

function Flashcards({ cards, multi }) {
  const [deck, setDeck] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [unknown, setUnknown] = useState([]);
  const [known, setKnown] = useState(0);
  const done = index >= deck.length;

  const next = (knewIt) => {
    if (knewIt) setKnown((k) => k + 1);
    else setUnknown((u) => [...u, deck[index]]);
    setFlipped(false);
    setIndex((i) => i + 1);
  };
  const restart = (list) => { setDeck(list); setIndex(0); setFlipped(false); setUnknown([]); setKnown(0); };

  useEffect(() => {
    const onKey = (e) => {
      if (done || e.target.closest('input, textarea')) return;
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && e.key === 'ArrowRight') next(true);
      if (flipped && e.key === 'ArrowLeft') next(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (done) {
    return (
      <div className="study-result">
        <p className="result-score">{known} / {deck.length}</p>
        <p className="muted">알고 있는 카드</p>
        <div className="result-actions">
          {unknown.length > 0 && <button className="btn btn-primary" onClick={() => restart(unknown)}>모르는 카드 {unknown.length}장 다시</button>}
          <button className="btn" onClick={() => restart(shuffle(cards))}><Shuffle size={14} /> 처음부터 섞어서</button>
        </div>
      </div>
    );
  }

  const card = deck[index];
  return (
    <div className="flash">
      <div className="flash-progress"><span style={{ width: `${(index / deck.length) * 100}%` }} /></div>
      <div className="flash-meta">
        <span>{index + 1} / {deck.length}</span>
        {multi && <span className="muted ellipsis">{card.memo}</span>}
        <button className="icon-btn icon-btn-sm" onClick={() => restart(shuffle(deck))} title="섞기"><Shuffle size={14} /></button>
      </div>
      <button className={`flash-card${flipped ? ' flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
        <span className="flash-face flash-front">{card.front}</span>
        <span className="flash-face flash-back">{card.back}</span>
      </button>
      {flipped ? (
        <div className="flash-actions">
          <button className="btn btn-lg" onClick={() => next(false)}>모르겠어요 <kbd>←</kbd></button>
          <button className="btn btn-lg btn-primary" onClick={() => next(true)}>알아요 <kbd>→</kbd></button>
        </div>
      ) : (
        <p className="flash-hint">카드를 누르거나 <kbd>Space</kbd>로 뒤집기</p>
      )}
    </div>
  );
}

function Quiz({ questions, multi }) {
  const [order, setOrder] = useState(questions);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const done = index >= order.length;

  const choose = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === order[index].answer) setScore((s) => s + 1);
  };
  const next = () => { setPicked(null); setIndex((i) => i + 1); };
  const restart = () => { setOrder(shuffle(questions)); setIndex(0); setPicked(null); setScore(0); };

  if (done) {
    return (
      <div className="study-result">
        <p className="result-score">{score} / {order.length}</p>
        <p className="muted">정답</p>
        <div className="result-actions"><button className="btn btn-primary" onClick={restart}><RotateCcw size={14} /> 다시 풀기</button></div>
      </div>
    );
  }

  const q = order[index];
  return (
    <div className="quiz">
      <div className="flash-progress"><span style={{ width: `${(index / order.length) * 100}%` }} /></div>
      <div className="flash-meta"><span>{index + 1} / {order.length}</span>{multi && <span className="muted ellipsis">{q.memo}</span>}</div>
      <h2 className="quiz-q">{q.question}</h2>
      <ol className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = 'quiz-opt';
          if (picked !== null && i === q.answer) cls += ' correct';
          else if (picked === i) cls += ' wrong';
          return (
            <li key={i}>
              <button className={cls} onClick={() => choose(i)} disabled={picked !== null}>
                <span className="quiz-letter">{'ABCD'[i]}</span> {opt}
              </button>
            </li>
          );
        })}
      </ol>
      {picked !== null && (
        <div className="quiz-feedback">
          <p><b>{picked === q.answer ? '정답이에요.' : '아쉬워요.'}</b> {q.explanation}</p>
          <button className="btn btn-primary" onClick={next}>{index + 1 < order.length ? '다음 문제' : '결과 보기'}</button>
        </div>
      )}
    </div>
  );
}

function StudyHome() {
  const { memos, categories } = useApp();
  const rows = useMemo(() => {
    const studied = memos.filter((m) => m.study?.cards?.length || m.study?.quiz?.length);
    return categories
      .map((c) => {
        const list = studied.filter((m) => m.categoryId === c.id);
        return { category: c, memos: list, cards: list.reduce((n, m) => n + (m.study.cards?.length || 0), 0) };
      })
      .filter((r) => r.memos.length);
  }, [memos, categories]);
  const loose = memos.filter((m) => (m.study?.cards?.length || m.study?.quiz?.length) && !categories.some((c) => c.id === m.categoryId));

  return (
    <>
    <PageBar back="/" crumbs={[{ label: '모든 메모', href: '/' }, { label: '학습' }]} />
    <div className="page page-narrow">
      <header className="page-head">
        <div>
          <h1 className="page-title">학습</h1>
          <p className="page-sub">완료한 메모로 만든 플래시카드와 퀴즈를 카테고리별로 복습해요.</p>
        </div>
      </header>
      {!rows.length && !loose.length ? (
        <div className="empty">
          <GraduationCap size={22} className="muted" />
          <p className="empty-sub">아직 학습 카드가 없어요. 메모를 완료하면 자동으로 만들어져요 (설정에서 끌 수 있어요).</p>
        </div>
      ) : (
        <div className="study-list">
          {rows.map(({ category, memos: list, cards }) => (
            <a key={category.id} className="study-row" href={`#/study/c/${category.id}`}>
              <CategoryDot color={category.color} size={9} />
              <span className="study-row-name">{category.name}</span>
              <span className="muted">메모 {list.length} · 카드 {cards}</span>
            </a>
          ))}
          {loose.map((m) => (
            <a key={m.id} className="study-row" href={`#/study/m/${m.id}`}>
              <CategoryDot color="none" size={9} />
              <span className="study-row-name">{memoTitle(m)}</span>
              <span className="muted">카드 {m.study.cards?.length || 0}</span>
            </a>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
