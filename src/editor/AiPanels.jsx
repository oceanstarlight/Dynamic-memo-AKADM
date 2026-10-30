import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { X, RefreshCw, Sparkles, ArrowRight, Undo2, House, SquarePen } from 'lucide-react';
import { useApp } from '../AppContext';
import { spellCheck, tidyMemo, hasGeminiKey, SPELL_TEXT_BUDGET } from '../lib/gemini';
import { findCategoryByName } from '../lib/categories';
import { formatRelative, hashText } from '../lib/text';
import { buildPreviewExtensions, replaceTextInDoc } from './extensions';
import { CategoryPill, Spinner } from '../components/common';
import { navigate } from '../lib/router';

function PanelHead({ title, onClose, children }) {
  return (
    <div className="panel-head">
      <h3>{title}</h3>
      <div className="panel-head-actions">
        {children}
        {onClose && <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="닫기"><X size={15} /></button>}
      </div>
    </div>
  );
}

function KeyMissing() {
  if (hasGeminiKey()) return null;
  return <p className="panel-warn">Gemini API 키가 없어서 AI 기능을 쓸 수 없어요. GitHub Secret <code>GEMINI_API_KEY</code>를 설정한 뒤 다시 배포해 주세요.</p>;
}

// ------------------------------------------------------------
//  요약 · 분류
// ------------------------------------------------------------
// 요약 패널: 닫기(X)로 메모로 돌아가거나, 아래쪽 '홈으로 / 새 메모' 버튼으로 다음 동작을 고른다
export function InsightPanel({ memo, memoId, tooShort, onClose, onRun }) {
  const { busy, categories, store, applySuggestedCategory } = useApp();
  const ai = memo?.ai;
  const running = busy[memoId] === 'analyze';
  const [summary, setSummary] = useState(ai?.summary || '');
  useEffect(() => { setSummary(ai?.summary || ''); }, [ai?.summary]);

  const stale = ai && memo && ai.sourceHash !== hashText(memo.text || '');
  const current = categories.find((c) => c.id === memo?.categoryId);
  const suggested = ai?.category && findCategoryByName(categories, ai.category);
  const suggestionPending = ai?.category && (!current || current.name !== ai.category);

  const saveSummary = () => {
    if (!ai || summary.trim() === ai.summary) return;
    store.patchMemo(memoId, { ai: { ...ai, summary: summary.trim(), summaryEdited: true } });
  };

  return (
    <div className="panel">
      <PanelHead title="요약 · 분류" onClose={onClose}>
        {!tooShort && (
          <button className="btn btn-sm" onClick={onRun} disabled={running}>
            {running ? <Spinner size={11} /> : <RefreshCw size={13} />} {ai ? '다시 분석' : '분석하기'}
          </button>
        )}
      </PanelHead>
      {tooShort ? (
        <p className="panel-short">내용이 없거나 너무 짧아서 요약할 수 없습니다.</p>
      ) : (
        <>
        <KeyMissing />
        {memo?.aiError && !running && <p className="panel-error">최근 분석 실패: {memo.aiError}</p>}

        {!ai && !running && (
          <p className="panel-empty">‘작성 완료’를 누르면 AI가 요약하고 카테고리를 정해요. 지금 바로 분석할 수도 있어요.</p>
        )}
        {running && !ai && <div className="panel-loading"><Spinner /> 메모를 읽는 중…</div>}

        {ai && (
          <>
            {stale && <p className="panel-note">분석 이후 본문이 바뀌었어요. 다시 분석하면 최신 내용으로 정리돼요.</p>}

            <section className="panel-sec">
              <h4>카테고리</h4>
              <div className="sugg-row">
                <CategoryPill category={current} fallback="미분류" />
                {suggestionPending && (
                  <>
                    <ArrowRight size={13} className="muted" />
                    <CategoryPill category={suggested || { name: ai.category, color: 'gray' }} />
                    <button className="btn btn-sm btn-primary" onClick={() => applySuggestedCategory(memoId)}>적용</button>
                  </>
                )}
              </div>
              {ai.categoryReason && <p className="panel-reason"><Sparkles size={12} /> {ai.categoryReason}</p>}
              {ai.isNewCategory && !suggested && <p className="panel-reason">적용하면 새 카테고리가 만들어져요.</p>}
            </section>

            <section className="panel-sec">
              <h4>요약 <span className="h4-hint">직접 고칠 수 있어요</span></h4>
              <textarea className="summary-edit" value={summary} rows={4} onChange={(e) => setSummary(e.target.value)} onBlur={saveSummary} />
            </section>

            {ai.keyPoints?.length > 0 && (
              <section className="panel-sec">
                <h4>핵심</h4>
                <ul className="keypoints">{ai.keyPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </section>
            )}

            <p className="panel-meta">{ai.model} · {formatRelative(ai.analyzedAt)}</p>
          </>
        )}
        </>
      )}

      <div className="panel-footer">
        <button className="btn" onClick={() => navigate('/')}><House size={14} /> 홈으로 돌아가기</button>
        <button className="btn btn-primary" onClick={() => navigate('/new')}><SquarePen size={14} /> 새 메모 작성</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
//  맞춤법 검사
// ------------------------------------------------------------
export function SpellPanel({ editor, getText, onClose }) {
  const [issues, setIssues] = useState(null);
  const [truncated, setTruncated] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    const text = getText();
    if (!text.trim()) { setError('검사할 내용이 없어요.'); return; }
    setRunning(true);
    setError('');
    try {
      const result = await spellCheck(text);
      setIssues(result.issues);
      setTruncated(result.truncated);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const apply = (issue) => {
    const ok = replaceTextInDoc(editor, issue.original, issue.corrected);
    setIssues((list) => list.map((i) => (i === issue ? { ...i, state: ok ? 'applied' : 'missing' } : i)));
  };
  const dismiss = (issue) => setIssues((list) => list.map((i) => (i === issue ? { ...i, state: 'ignored' } : i)));
  const applyAll = () => issues.filter((i) => !i.state).forEach(apply);

  const open = issues?.filter((i) => !i.state) || [];

  return (
    <div className="panel">
      <PanelHead title="맞춤법 검사" onClose={onClose}>
        <button className="btn btn-sm" onClick={run} disabled={running}>
          {running ? <Spinner size={11} /> : <RefreshCw size={13} />} {issues ? '다시 검사' : '검사하기'}
        </button>
      </PanelHead>
      <KeyMissing />
      {error && <p className="panel-error">{error}</p>}
      {!issues && !running && <p className="panel-empty">맞춤법과 띄어쓰기를 확인해요. 문체나 내용은 바꾸지 않아요.</p>}
      {running && <div className="panel-loading"><Spinner /> 검사 중…</div>}
      {issues && !running && (
        <>
          {truncated && <p className="panel-note">메모가 길어서 앞부분 {SPELL_TEXT_BUDGET.toLocaleString()}자만 검사했어요.</p>}
          {issues.length === 0 && <p className="panel-empty">고칠 곳을 찾지 못했어요.</p>}
          {open.length > 1 && <button className="btn btn-sm btn-block" onClick={applyAll}>남은 {open.length}개 모두 고치기</button>}
          <ul className="issue-list">
            {issues.map((issue, i) => (
              <li key={i} className={`issue${issue.state ? ` issue-${issue.state}` : ''}`}>
                <div className="issue-diff">
                  <del>{issue.original}</del>
                  <ArrowRight size={12} className="muted" />
                  <ins>{issue.corrected}</ins>
                </div>
                {issue.reason && <p className="issue-reason">{issue.reason}</p>}
                {!issue.state ? (
                  <div className="issue-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => apply(issue)}>고치기</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => dismiss(issue)}>무시</button>
                  </div>
                ) : (
                  <p className="issue-state">{{ applied: '고침', ignored: '무시함', missing: '본문에서 찾지 못했어요' }[issue.state]}</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------
//  AI 정리 (구조 다듬기) — 미리보기 후 적용, 되돌리기 가능
// ------------------------------------------------------------
export function TidyPanel({ editor, onClose }) {
  const { toast } = useApp();
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const preview = useEditor({ extensions: buildPreviewExtensions(), editable: false, content: '' }, []);

  useEffect(() => {
    if (preview && result) preview.commands.setContent(result.html, { emitUpdate: false });
  }, [preview, result]);

  const run = async () => {
    if (editor.isEmpty) { setError('정리할 내용이 없어요.'); return; }
    setRunning(true);
    setError('');
    setResult(null);
    try {
      setResult(await tidyMemo(editor.getHTML()));
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const apply = () => {
    // 미리보기 에디터가 스키마로 걸러낸 HTML을 그대로 쓴다
    editor.chain().focus().setContent(preview.getHTML(), { emitUpdate: true }).run();
    setResult(null);
    toast('본문을 정리했어요', { action: { label: '되돌리기', onClick: () => editor.chain().focus().undo().run() } });
  };

  return (
    <div className="panel">
      <PanelHead title="AI 정리" onClose={onClose}>
        <button className="btn btn-sm" onClick={run} disabled={running}>
          {running ? <Spinner size={11} /> : <RefreshCw size={13} />} {result ? '다시' : '정리하기'}
        </button>
      </PanelHead>
      <KeyMissing />
      {error && <p className="panel-error">{error}</p>}
      {!result && !running && <p className="panel-empty">내용은 그대로 두고 제목, 목록, 강조 같은 구조만 다듬어요. 적용 전에 미리 볼 수 있어요.</p>}
      {running && <div className="panel-loading"><Spinner /> 다듬는 중…</div>}
      {result && (
        <>
          {result.note && <p className="panel-note">{result.note}</p>}
          <div className="tidy-preview"><EditorContent editor={preview} className="prose prose-sm" /></div>
          <div className="issue-actions">
            <button className="btn btn-sm btn-primary" onClick={apply}>본문에 적용</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setResult(null)}>취소</button>
          </div>
          <p className="panel-meta"><Undo2 size={11} /> 적용 후에도 Ctrl+Z로 되돌릴 수 있어요.</p>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------
//  학습 카드
// ------------------------------------------------------------
export function StudyPanel({ memo, memoId, onClose, onRun }) {
  const { busy } = useApp();
  const study = memo?.study;
  const running = busy[memoId] === 'study';
  const stale = study && memo && study.sourceHash !== hashText(memo.text || '');

  return (
    <div className="panel">
      <PanelHead title="학습 카드" onClose={onClose}>
        <button className="btn btn-sm" onClick={onRun} disabled={running}>
          {running ? <Spinner size={11} /> : <RefreshCw size={13} />} {study ? '다시 만들기' : '만들기'}
        </button>
      </PanelHead>
      <KeyMissing />
      {!study && !running && <p className="panel-empty">이 메모로 플래시카드와 객관식 퀴즈를 만들어요. 요약과는 별도로 호출해요.</p>}
      {running && <div className="panel-loading"><Spinner /> 문제를 만드는 중…</div>}
      {study && (
        <>
          {stale && <p className="panel-note">카드를 만든 뒤 본문이 바뀌었어요.</p>}
          <div className="study-stats">
            <div><b>{study.cards.length}</b><span>플래시카드</span></div>
            <div><b>{study.quiz.length}</b><span>퀴즈</span></div>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => navigate(`/study/m/${memoId}`)}>학습 시작</button>
          <ul className="card-preview">
            {study.cards.slice(0, 4).map((c, i) => <li key={i}><b>{c.front}</b><span>{c.back}</span></li>)}
          </ul>
          <p className="panel-meta">{formatRelative(study.createdAt)} 생성</p>
        </>
      )}
    </div>
  );
}
