import { useRef, useState } from 'react';
import { FileUp, FileText, CircleCheck, CircleAlert, Sparkles, House, X } from 'lucide-react';
import { useApp } from '../AppContext';
import { navigate } from '../lib/router';
import { IMPORT_ACCEPT, parseImportFile } from '../lib/importFile';
import { findCategoryByName } from '../lib/categories';
import { CategoryPill, Modal, Spinner } from './common';

// 파일 올림 → txt/md 인식 → '내 메모로 불러오기' 또는 'AI 자동 분류'
export default function ImportDialog({ onClose }) {
  const { store, settings, categories, runAnalysis, runStudy, toast } = useApp();
  const [items, setItems] = useState([]); // { key, name, status: reading|ready|error|saving|analyzing|done, parsed, error, memoId, category }
  const [phase, setPhase] = useState('pick'); // pick | working | done
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const update = (key, patch) => setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  const addFiles = (fileList) => {
    const files = [...fileList];
    if (!files.length) return;
    const added = files.map((file, i) => ({ key: `${Date.now()}-${i}-${file.name}`, name: file.name, status: 'reading' }));
    setItems((list) => [...list, ...added]);
    files.forEach((file, i) => {
      parseImportFile(file)
        .then((parsed) => update(added[i].key, { status: 'ready', parsed }))
        .catch((error) => update(added[i].key, { status: 'error', error: error.message }));
    });
  };

  const ready = items.filter((it) => it.status === 'ready');
  const reading = items.some((it) => it.status === 'reading');

  const saveAll = async (status) => {
    const saved = [];
    for (const it of ready) {
      const memoId = store.newMemoId();
      update(it.key, { status: 'saving' });
      const { title, html, text, name, kind } = it.parsed;
      await store.saveMemo(memoId, { title, html, text, status, source: { name, kind } }, { isNew: true });
      update(it.key, { status: status === 'done' ? 'analyzing' : 'done', memoId });
      saved.push({ ...it, memoId });
    }
    return saved;
  };

  const importOnly = async () => {
    setPhase('working');
    try {
      const saved = await saveAll('draft');
      onClose();
      if (saved.length === 1) navigate(`/m/${saved[0].memoId}`);
      else { toast(`메모 ${saved.length}개를 불러왔어요`); navigate('/'); }
    } catch (error) {
      toast(`불러오기 실패: ${error.message}`, { tone: 'error' });
      setPhase('pick');
    }
  };

  const importAndClassify = async () => {
    setPhase('working');
    let saved;
    try {
      saved = await saveAll('done');
    } catch (error) {
      toast(`불러오기 실패: ${error.message}`, { tone: 'error' });
      setPhase('pick');
      return;
    }
    // 카테고리가 앞 파일 결과를 참고할 수 있게 순서대로 분석한다
    for (const it of saved) {
      const { text, title } = it.parsed;
      const ai = await runAnalysis(it.memoId, { text, title }, { force: true, categorize: true, silent: true });
      update(it.key, { status: 'done', category: ai?.category || null, failed: !ai });
      if (ai && settings.autoStudy) runStudy(it.memoId, { text });
    }
    setPhase('done');
  };

  const onlyOne = items.length === 1 && items[0].memoId;

  return (
    <Modal onClose={phase === 'working' ? () => {} : onClose} className="import" label="파일 불러오기">
      <div className="modal-head">
        <h2>파일 불러오기</h2>
        {phase !== 'working' && <button className="icon-btn" onClick={onClose} aria-label="닫기"><X size={16} /></button>}
      </div>

      {phase === 'pick' && (
        <label
          className={`dropzone${dragging ? ' over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        >
          <FileUp size={20} className="muted" />
          <span className="dropzone-title">{items.length ? '파일 더 추가하기' : 'txt, md 파일을 선택하거나 끌어다 놓기'}</span>
          <span className="dropzone-sub">여러 개도 한 번에 올릴 수 있어요 · 파일당 최대 800KB</span>
          <input ref={inputRef} type="file" accept={IMPORT_ACCEPT} multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        </label>
      )}

      {items.length > 0 && (
        <ul className="import-list">
          {items.map((it) => (
            <li key={it.key} className={`import-item import-st-${it.status}`}>
              <FileText size={16} className="muted import-icon" />
              <div className="import-body">
                <div className="import-name">
                  <span className="ellipsis">{it.parsed?.title || it.name}</span>
                  {it.parsed && <span className="import-kind">{it.parsed.kind === 'markdown' ? 'Markdown' : '텍스트'}</span>}
                </div>
                <div className="import-meta">
                  {it.status === 'reading' && <><Spinner size={10} /> 읽는 중…</>}
                  {it.status === 'error' && <span className="import-error"><CircleAlert size={12} /> {it.error}</span>}
                  {it.status === 'ready' && (
                    <>
                      <CircleCheck size={12} className="ok" /> 인식 완료 · {it.parsed.text.length.toLocaleString()}자
                      {it.parsed.encoding !== 'UTF-8' && ` · ${it.parsed.encoding}`}
                    </>
                  )}
                  {it.status === 'saving' && <><Spinner size={10} /> 저장 중…</>}
                  {it.status === 'analyzing' && <><Spinner size={10} /> AI가 분류하는 중…</>}
                  {it.status === 'done' && !it.category && !it.failed && <><CircleCheck size={12} className="ok" /> 불러옴</>}
                  {it.status === 'done' && it.failed && <span className="import-error"><CircleAlert size={12} /> 불러왔지만 분류는 못 했어요</span>}
                  {it.status === 'done' && it.category && (
                    <><CircleCheck size={12} className="ok" /> <CategoryPill category={findCategoryByName(categories, it.category) || { name: it.category, color: 'gray' }} /> 에 분류</>
                  )}
                </div>
                {it.status === 'ready' && <p className="import-preview">{it.parsed.text.slice(0, 140)}</p>}
              </div>
              {phase === 'pick' && it.status !== 'reading' && (
                <button className="icon-btn icon-btn-sm" onClick={() => setItems((list) => list.filter((x) => x.key !== it.key))} aria-label="목록에서 빼기"><X size={13} /></button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="import-actions">
        {phase === 'done' ? (
          <>
            <button className="btn" onClick={() => { onClose(); navigate('/'); }}><House size={14} /> 홈으로</button>
            {onlyOne && <button className="btn btn-primary" onClick={() => { onClose(); navigate(`/m/${items[0].memoId}`); }}>메모 열기</button>}
          </>
        ) : (
          <>
            <button className="btn" onClick={importOnly} disabled={!ready.length || reading || phase === 'working'}>내 메모로 불러오기</button>
            <button className="btn btn-primary" onClick={importAndClassify} disabled={!ready.length || reading || phase === 'working'}>
              {phase === 'working' ? <Spinner size={12} /> : <Sparkles size={14} />} AI 자동 분류
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
