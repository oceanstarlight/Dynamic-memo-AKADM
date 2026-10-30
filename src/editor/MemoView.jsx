import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getHTMLFromFragment } from '@tiptap/core';
import {
  ImagePlus, Table, SpellCheck, WandSparkles, Sparkles, GraduationCap, Ellipsis, Trash2, Type, Check, Cloud, CloudOff,
  Pin, PinOff, Download,
} from 'lucide-react';
import { useApp, MIN_AI_LENGTH } from '../AppContext';
import { navigate, useRoute } from '../lib/router';
import { fileToCompressedDataUrl } from '../lib/image';
import { formatTime } from '../lib/text';
import { buildExtensions } from './extensions';
import { BlockBubble, FormatBar, SelectionBubble, useSlashMenu } from './FormatTools';
import { CategorySelect, TagEditor } from './Properties';
import { InsightPanel, SpellPanel, TidyPanel, StudyPanel } from './AiPanels';
import { Popover, Spinner } from '../components/common';
import PageBar from '../components/PageBar';
import RelatedMemos from '../components/RelatedMemos';
import { downloadMemo } from '../lib/exportMd';

const AUTOSAVE_DELAY = 1200;
const MAX_HTML_BYTES = 900 * 1024; // Firestore 문서 한도(1MB) 여유분

const TOOLS = [
  { id: 'image', label: '사진 추가', icon: ImagePlus },
  { id: 'table', label: '표 추가', icon: Table },
  { id: 'spell', label: '맞춤법 검사', icon: SpellCheck, panel: true },
  { id: 'tidy', label: 'AI 정리', icon: WandSparkles, panel: true },
  { id: 'insight', label: '요약 · 분류', icon: Sparkles, panel: true },
  { id: 'study', label: '학습 카드', icon: GraduationCap, panel: true },
];

export default function MemoView({ memoId }) {
  const {
    memos, categories, store, settings, loaded, busy, isGuest, toast, runAnalysis, runStudy, moveMemoToCategory,
    removeMemo, togglePin,
  } = useApp();
  const { params } = useRoute();
  const memo = memos.find((m) => m.id === memoId) || null;
  const isNewParam = params.get('new') === '1';
  const presetCategory = params.get('c');

  const [title, setTitle] = useState('');
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | dirty | saving | saved | error
  const [savedAt, setSavedAt] = useState(null);
  const [panel, setPanel] = useState(null);
  const [formatOpen, setFormatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [tooShort, setTooShort] = useState(false); // 작성 완료했지만 본문이 짧아 요약을 건너뜀

  const existsRef = useRef(!isNewParam);
  const titleRef = useRef('');
  const docRef = useRef(null);
  const versionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const timerRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const fileInputRef = useRef(null);
  const slashKeyRef = useRef(() => false);

  const isDirty = () => versionRef.current !== savedVersionRef.current;

  // ------------------------------------------------------------
  //  에디터
  // ------------------------------------------------------------
  const insertImageFiles = useCallback(async (files, ed) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const src = await fileToCompressedDataUrl(file);
        ed.chain().focus().setImage({ src, alt: file.name }).run();
      } catch (error) {
        toast(`사진을 넣지 못했어요: ${error.message}`, { tone: 'error' });
      }
    }
  }, [toast]);

  const editor = useEditor({
    extensions: buildExtensions(),
    content: '',
    editorProps: {
      attributes: { class: 'prose', spellcheck: 'false' },
      handleKeyDown: (_view, event) => slashKeyRef.current(event),
      handlePaste: (_view, event) => {
        const files = [...(event.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
        if (!files.length) return false;
        insertImageFiles(files, editorRef.current);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = [...(event.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
        if (!files.length) return false;
        event.preventDefault();
        insertImageFiles(files, editorRef.current);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      docRef.current = ed.state.doc;
      markDirty();
    },
  }, []);
  const editorRef = useRef(null);
  editorRef.current = editor;

  const pickImage = () => fileInputRef.current?.click();
  const slash = useSlashMenu(editor, pickImage);
  slashKeyRef.current = slash.handleKey;

  // 메모 데이터를 한 번만 에디터에 싣는다 (이후엔 에디터가 원본)
  useEffect(() => {
    if (!editor || ready || !loaded) return;
    if (!memo && !isNewParam) return;
    editor.commands.setContent(memo?.html || '', { emitUpdate: false });
    docRef.current = editor.state.doc;
    setTitle(memo?.title || '');
    titleRef.current = memo?.title || '';
    setReady(true);
    if (isNewParam) requestAnimationFrame(() => document.querySelector('.memo-title')?.focus());
  }, [editor, ready, loaded, memo, isNewParam]);

  // AI가 빈 제목을 채워 주면 반영
  useEffect(() => {
    if (ready && memo?.title && !titleRef.current.trim() && document.activeElement?.className !== 'memo-title') {
      setTitle(memo.title);
      titleRef.current = memo.title;
    }
  }, [memo?.title, ready]);

  // ------------------------------------------------------------
  //  저장
  // ------------------------------------------------------------
  const snapshot = () => {
    const doc = docRef.current;
    const schema = editorRef.current?.schema;
    if (!doc || !schema) return null;
    return {
      html: getHTMLFromFragment(doc.content, schema),
      text: doc.textBetween(0, doc.content.size, '\n', ' '),
      empty: doc.textContent.trim() === '' && doc.childCount <= 1 && !doc.firstChild?.childCount,
    };
  };

  const save = useCallback(async ({ status } = {}) => {
    clearTimeout(timerRef.current);
    const snap = snapshot();
    if (!snap) return false;
    const exists = existsRef.current;
    if (!exists && !titleRef.current.trim() && snap.empty) return false;
    if (snap.html.length > MAX_HTML_BYTES) {
      setSaveState('error');
      toast('메모가 너무 커서 저장할 수 없어요. 사진 수를 줄여 주세요.', { tone: 'error', duration: 7000 });
      return false;
    }

    const data = { title: titleRef.current, html: snap.html, text: snap.text };
    if (status) data.status = status;
    else if (!exists) data.status = 'draft';
    if (!exists && presetCategory && categories.some((c) => c.id === presetCategory)) {
      data.categoryId = presetCategory;
      data.categoryManual = true;
    }

    const version = versionRef.current;
    setSaveState('saving');
    try {
      await store.saveMemo(memoId, data, { isNew: !exists });
      savedVersionRef.current = Math.max(savedVersionRef.current, version);
      if (!exists) {
        existsRef.current = true;
        navigate(`/m/${memoId}`, { replace: true });
      }
      setSavedAt(Date.now());
      setSaveState(isDirty() ? 'dirty' : 'saved');
      return true;
    } catch (error) {
      console.error(error);
      setSaveState('error');
      toast(`저장 실패: ${error.message}`, { tone: 'error' });
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoId, store, presetCategory, categories, toast]);

  const saveRef = useRef(save);
  saveRef.current = save;

  function markDirty() {
    versionRef.current += 1;
    setSaveState('dirty');
    if (settingsRef.current.autoSave) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => saveRef.current(), AUTOSAVE_DELAY);
    }
  }

  const onTitleChange = (e) => {
    setTitle(e.target.value);
    titleRef.current = e.target.value;
    markDirty();
  };

  // 탭을 숨기거나 화면을 떠날 때: 자동 저장이면 바로 올리고, 아니면 확인을 받는다
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && isDirty() && settingsRef.current.autoSave) saveRef.current();
    };
    const onBeforeUnload = (e) => {
      if (!isDirty()) return;
      if (settingsRef.current.autoSave) saveRef.current();
      else { e.preventDefault(); e.returnValue = ''; }
    };
    const onHashChange = (e) => {
      if (!isDirty() || settingsRef.current.autoSave) return;
      // 내부에서 주소만 바꾸는 이동(replace)은 newURL이 비어 있으므로 현재 주소로 판단한다
      if ((e.newURL || window.location.href).includes(`/m/${memoId}`)) return;
      if (!confirm('저장하지 않은 변경사항이 있어요. 저장하지 않고 나갈까요?')) {
        navigate(`/m/${memoId}`, { replace: true });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('hashchange', onHashChange);
      clearTimeout(timerRef.current);
      if (isDirty() && settingsRef.current.autoSave) saveRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoId]);

  // Ctrl/Cmd + S: 언제든 수동 저장
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current().then((ok) => ok && !settingsRef.current.autoSave && toast('저장했어요'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toast]);

  // 속성 변경 전에 문서가 서버에 있어야 하는 경우
  const ensureSaved = async () => {
    if (existsRef.current && !isDirty()) return true;
    const ok = await save();
    if (!ok && !existsRef.current) toast('먼저 내용을 조금 적어 주세요.');
    return existsRef.current;
  };

  // ------------------------------------------------------------
  //  작성 완료 → Gemini
  // ------------------------------------------------------------
  const complete = async () => {
    const before = snapshot();
    // 제목과 본문이 모두 비어 있으면 저장하지 않는다
    if (!titleRef.current.trim() && (!before || before.empty)) {
      toast('제목과 내용이 모두 비어 있어서 저장하지 않았어요.');
      return;
    }
    setCompleting(true);
    try {
      const ok = await save({ status: 'done' });
      if (!ok) return;
      const { text } = snapshot();
      const s = settingsRef.current;
      // 본문이 짧으면 Gemini를 부르지 않고 요약 패널에 안내만 띄운다
      if (text.trim().length < MIN_AI_LENGTH) {
        setTooShort(true);
        openPanel('insight');
        return;
      }
      setTooShort(false);
      if (s.autoAnalyze) {
        openPanel('insight');
        await runAnalysis(memoId, { text, title: titleRef.current });
      } else {
        toast('완료했어요. 요약 · 분류는 오른쪽 도구에서 직접 실행할 수 있어요.');
      }
      if (s.autoStudy) runStudy(memoId, { text });
    } finally {
      setCompleting(false);
    }
  };

  const remove = () => {
    setMenuOpen(false);
    if (!settings.useTrash && !confirm('이 메모를 삭제할까요? 휴지통을 꺼 두셔서 되돌릴 수 없습니다.')) return;
    clearTimeout(timerRef.current);
    savedVersionRef.current = versionRef.current; // 나갈 때 저장/확인하지 않게
    // 서버 응답(느린 네트워크에서는 몇 초)을 기다리지 않고 바로 화면을 옮긴다 — 기다리면 버튼이 안 눌린 것처럼 보였음
    navigate(memo?.categoryId ? `/c/${memo.categoryId}` : '/');
    if (existsRef.current) {
      removeMemo(memoId).catch((error) => toast(`삭제 실패: ${error.message}`, { tone: 'error' }));
    }
  };

  const exportMd = () => {
    setMenuOpen(false);
    const snap = snapshot();
    downloadMemo({ title: titleRef.current, html: snap?.html ?? memo?.html ?? '' });
  };

  // 창이 겹치지 않게: 하나를 열면 나머지(더보기 메뉴, 모바일에서는 서식 바 · 패널)는 닫는다
  const isNarrow = () => window.matchMedia('(max-width: 860px)').matches;
  function openPanel(id) {
    setMenuOpen(false);
    if (isNarrow()) setFormatOpen(false);
    if (id !== 'insight') setTooShort(false);
    setPanel(id);
  }
  const closePanel = () => { setPanel(null); setTooShort(false); };
  const toggleFormat = () => {
    const next = !formatOpen;
    if (next) { setMenuOpen(false); if (isNarrow()) closePanel(); }
    setFormatOpen(next);
  };
  const toggleMenu = () => {
    if (!menuOpen && isNarrow()) closePanel();
    setMenuOpen(!menuOpen);
  };

  const onTool = (tool) => {
    if (!editor) return;
    if (!tool.panel) {
      setMenuOpen(false);
      if (isNarrow()) closePanel();
    }
    if (tool.id === 'image') { pickImage(); return; }
    if (tool.id === 'table') { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); return; }
    if (panel === tool.id) closePanel(); else openPanel(tool.id);
  };

  // ------------------------------------------------------------
  if (loaded && !memo && !isNewParam && !existsRef.current) {
    return (
      <>
        <PageBar back="/" crumbs={[{ label: '모든 메모', href: '/' }, { label: '없는 메모' }]} />
        <div className="page"><div className="empty"><p className="empty-title">메모를 찾을 수 없어요</p><p className="empty-sub">삭제됐거나 휴지통에 있을 수 있어요.</p></div></div>
      </>
    );
  }

  const category = categories.find((c) => c.id === (memo?.categoryId ?? (existsRef.current ? null : presetCategory)));
  const working = busy[memoId];
  const currentText = () => snapshot()?.text || '';

  return (
    <div className={`memo-layout${panel ? ' with-panel' : ''}`}>
      <div className="memo-main">
        <PageBar
          back={category ? `/c/${category.id}` : '/'}
          crumbs={[{ label: '모든 메모', href: '/' }, category ? { label: category.name, href: `/c/${category.id}` } : { label: '미분류', href: '/c/none' }]}
        >
            <SaveIndicator state={saveState} savedAt={savedAt} autoSave={settings.autoSave} isGuest={isGuest} />
            {working && <span className="topbar-flag"><Spinner size={11} /> {working === 'study' ? '학습 카드 만드는 중' : 'AI 정리 중'}</span>}
            <button className={`icon-btn${formatOpen ? ' on' : ''}`} onClick={toggleFormat} title="서식 도구" aria-pressed={formatOpen}>
              <Type size={16} />
            </button>
            {!settings.autoSave && (
              <button className="btn" onClick={() => save().then((ok) => ok && toast('저장했어요'))} disabled={saveState === 'saving'}>저장</button>
            )}
            <button className="btn btn-primary" onClick={complete} disabled={completing || !ready}>
              {completing ? <Spinner size={12} /> : <Check size={15} />} 작성 완료
            </button>
            <div className="rel">
              <button className="icon-btn" onClick={toggleMenu} aria-label="더보기"><Ellipsis size={16} /></button>
              <Popover open={menuOpen} onClose={() => setMenuOpen(false)} align="right">
                {memo && (
                  <button className="menu-item" onClick={() => { setMenuOpen(false); togglePin(memo); }}>
                    {memo.pinned ? <><PinOff size={15} /> 고정 해제</> : <><Pin size={15} /> 맨 위에 고정</>}
                  </button>
                )}
                <button className="menu-item" onClick={exportMd}><Download size={15} /> md로 내보내기</button>
                <button className="menu-item danger" onClick={remove}><Trash2 size={15} /> {settings.useTrash ? '휴지통으로 이동' : '메모 삭제'}</button>
              </Popover>
            </div>
        </PageBar>

        {formatOpen && editor && <div className="format-wrap"><FormatBar editor={editor} /></div>}

        <article className="memo-doc">
          <textarea
            className="memo-title" rows={1} placeholder="제목 없음" value={title}
            onChange={onTitleChange}
            onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`; }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); editor?.commands.focus('start'); } }}
          />
          <div className="props">
            <div className="prop">
              <span className="prop-label">카테고리</span>
              <CategorySelect
                value={category?.id || null}
                suggestion={memo?.ai?.category}
                onChange={async (categoryId) => { if (await ensureSaved()) moveMemoToCategory(memoId, categoryId); }}
              />
            </div>
            <div className="prop">
              <span className="prop-label">태그</span>
              <TagEditor
                tags={memo?.tags || []}
                onChange={async (tags) => { if (await ensureSaved()) store.patchMemo(memoId, { tags }); }}
              />
            </div>
            {memo?.ai?.summary && (
              <div className="prop prop-summary">
                <span className="prop-label">요약</span>
                <button className="prop-summary-text" onClick={() => openPanel('insight')}>{memo.ai.summary}</button>
              </div>
            )}
          </div>
          {editor && <SelectionBubble editor={editor} />}
          {editor && <BlockBubble editor={editor} />}
          <EditorContent editor={editor} className="editor-host" />
          {slash.element}
          {settings.relatedMemos && memo && <RelatedMemos memo={memo} />}
        </article>
      </div>

      <div className="tool-rail" role="toolbar" aria-label="부가 도구">
        {TOOLS.map((tool) => (
          <button
            key={tool.id} className={`rail-btn${panel === tool.id ? ' on' : ''}`}
            onClick={() => onTool(tool)} title={tool.label} aria-label={tool.label}
          >
            <tool.icon size={17} />
            <span className="rail-label">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* 모바일: 패널이 떠 있는 동안 뒤 화면이 눌리지 않게 막고, 바깥을 누르면 패널을 닫는다 */}
      {panel && <div className="panel-scrim" onClick={closePanel} />}
      {panel && (
        <aside className="side-panel">
          {panel === 'insight' && (
            <InsightPanel memo={memo} memoId={memoId} tooShort={tooShort} onClose={closePanel}
              onRun={async () => { if (await ensureSaved()) runAnalysis(memoId, { text: currentText(), title: titleRef.current }, { force: true }); }} />
          )}
          {panel === 'spell' && <SpellPanel editor={editor} getText={currentText} onClose={closePanel} />}
          {panel === 'tidy' && <TidyPanel editor={editor} onClose={closePanel} />}
          {panel === 'study' && (
            <StudyPanel memo={memo} memoId={memoId} onClose={closePanel}
              onRun={async () => { if (await ensureSaved()) runStudy(memoId, { text: currentText() }, { force: true }); }} />
          )}
        </aside>
      )}

      <input
        ref={fileInputRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { insertImageFiles([...e.target.files], editor); e.target.value = ''; }}
      />
    </div>
  );
}

function SaveIndicator({ state, savedAt, autoSave, isGuest }) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  let text = '';
  if (state === 'saving') text = '저장 중…';
  else if (state === 'error') text = '저장 실패';
  else if (state === 'dirty') text = autoSave ? '편집 중' : '저장 안 됨';
  else if (state === 'saved') text = isGuest ? '이 탭에 저장됨' : `저장됨 ${formatTime(savedAt)}`;
  else text = autoSave ? '자동 저장 켜짐' : (isGuest ? '게스트 · 자동 저장 없음' : '수동 저장');
  return (
    <span className={`save-ind save-${state}`}>
      {offline ? <CloudOff size={13} /> : <Cloud size={13} />}
      {offline && state !== 'saved' ? `오프라인 · ${text}` : text}
    </span>
  );
}
