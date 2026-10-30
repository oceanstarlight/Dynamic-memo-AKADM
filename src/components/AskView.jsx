import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useApp } from '../AppContext';
import { askNotes } from '../lib/gemini';
import { memoTitle } from '../lib/text';
import { Spinner } from './common';
import PageBar from './PageBar';

const MAX_MEMOS = 8;
const MAX_CHARS_PER_MEMO = 1500; // 요약 + 질문 단어 주변 발췌
const TOTAL_BUDGET = 10000;      // 한 번 질문에 보내는 메모 글자 수 상한
const SNIPPET_RADIUS = 250;
const PARTICLES = /(은|는|이|가|을|를|에|에서|의|와|과|도|로|으로|한|했던|하는|이야|야|지)$/;

// 질문 단어로 관련 메모를 먼저 고르고(검색), 고른 메모만 Gemini에 보낸다 → 비용 · 컨텍스트 절약
function pickMemos(question, memos, categories) {
  const tokens = [...new Set(question.toLowerCase().split(/[\s,.?!·~()"'[\]]+/)
    .flatMap((t) => [t, t.replace(PARTICLES, '')])
    .filter((t) => t.length >= 2))];
  const scored = memos.map((m) => {
    const title = (m.title || '').toLowerCase();
    const tags = (m.tags || []).join(' ').toLowerCase();
    const summary = (m.ai?.summary || '').toLowerCase();
    const text = (m.text || '').toLowerCase();
    let s = 0;
    tokens.forEach((t) => {
      if (title.includes(t)) s += 4;
      if (tags.includes(t)) s += 3;
      if (summary.includes(t)) s += 2;
      if (text.includes(t)) s += 1 + Math.min(3, text.split(t).length - 2);
    });
    return { m, s };
  });
  let picked = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, MAX_MEMOS).map((x) => x.m);
  // 단어가 하나도 안 걸리면 최근 메모 요약으로 대신 답하게 한다
  if (!picked.length) picked = memos.slice(0, 12);
  const catName = (id) => categories.find((c) => c.id === id)?.name;
  const fallback = picked.length > MAX_MEMOS;
  let used = 0;
  const result = [];
  for (const m of picked) {
    const body = fallback
      ? (m.ai?.summary || (m.text || '').slice(0, 300))
      : buildBody(m, tokens);
    if (used + body.length > TOTAL_BUDGET) break;
    used += body.length;
    result.push({ id: m.id, title: (m.title || '').slice(0, 60), category: catName(m.categoryId), body });
  }
  return result;
}

// 메모 전체 대신 '요약 + 질문 단어가 나온 부분 주변'만 보낸다. 짧은 메모는 본문 그대로
function buildBody(memo, tokens) {
  const text = memo.text || '';
  if (text.length <= MAX_CHARS_PER_MEMO) return text;
  const lower = text.toLowerCase();
  const windows = [];
  tokens.forEach((t) => {
    const at = lower.indexOf(t);
    if (at >= 0) windows.push([Math.max(0, at - SNIPPET_RADIUS), Math.min(text.length, at + t.length + SNIPPET_RADIUS)]);
  });
  windows.sort((a, b) => a[0] - b[0]);
  const merged = [];
  windows.forEach((w) => {
    const last = merged[merged.length - 1];
    if (last && w[0] <= last[1]) last[1] = Math.max(last[1], w[1]);
    else merged.push([...w]);
  });
  const summary = memo.ai?.summary ? `요약: ${memo.ai.summary}\n` : '';
  const snippets = merged.map(([a, b]) => `…${text.slice(a, b)}…`).join('\n');
  return (summary + (snippets || text.slice(0, MAX_CHARS_PER_MEMO))).slice(0, MAX_CHARS_PER_MEMO);
}

export default function AskView() {
  const { memos, categories, settings } = useApp();
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState([]);
  const [running, setRunning] = useState(false);
  const endRef = useRef(null);

  const ask = async () => {
    const q = question.trim();
    if (!q || running) return;
    setQuestion('');
    setRunning(true);
    setThread((t) => [...t, { question: q }]);
    try {
      const picked = pickMemos(q, memos, categories);
      const result = await askNotes({ question: q, memos: picked, history: thread.filter((x) => x.answer) });
      setThread((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, ...result } : x)));
    } catch (error) {
      setThread((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, error: error.message } : x)));
    } finally {
      setRunning(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  };

  return (
    <>
      <PageBar back="/" crumbs={[{ label: '모든 메모', href: '/' }, { label: '메모에게 질문' }]} />
      <div className="page page-narrow ask-page">
        <header className="page-head">
          <div>
            <h1 className="page-title">메모에게 질문</h1>
            <p className="page-sub">내 메모에서 관련된 것만 찾아 답해요. 메모에 없는 내용은 지어내지 않아요.</p>
          </div>
        </header>

        {!settings.askNotes && <p className="panel-note">설정에서 꺼져 있는 기능이에요. 그래도 여기서는 쓸 수 있어요.</p>}

        <div className="ask-thread">
          {!thread.length && (
            <div className="ask-examples">
              {['지난번에 정리한 운영체제 개념 요약해 줘', '할 일로 적어 둔 것 중에 아직 안 한 게 뭐야?', '마케팅 아이디어 메모들 공통점이 뭐야?'].map((ex) => (
                <button key={ex} className="chip" onClick={() => setQuestion(ex)}>{ex}</button>
              ))}
            </div>
          )}
          {thread.map((turn, i) => (
            <div key={i} className="ask-turn">
              <p className="ask-q">{turn.question}</p>
              {turn.answer && (
                <div className="ask-a">
                  <p>{turn.answer}</p>
                  {turn.sources?.length > 0 && (
                    <div className="ask-sources">
                      <span>출처</span>
                      {turn.sources.map((id) => {
                        const m = memos.find((x) => x.id === id);
                        return m ? <a key={id} className="chip" href={`#/m/${id}`}>{memoTitle(m)}</a> : null;
                      })}
                    </div>
                  )}
                </div>
              )}
              {turn.error && <p className="panel-error">{turn.error}</p>}
              {!turn.answer && !turn.error && <div className="panel-loading"><Spinner /> 메모를 찾아 읽는 중…</div>}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="ask-input">
          <textarea
            rows={1} value={question} placeholder={memos.length ? '무엇이든 물어보세요' : '먼저 메모를 몇 개 써 주세요'}
            disabled={!memos.length}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(); } }}
          />
          <button className="btn btn-primary" onClick={ask} disabled={!question.trim() || running} aria-label="질문 보내기">
            {running ? <Spinner size={12} /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </>
  );
}
