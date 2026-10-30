import { RotateCcw, Trash2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { memoTitle, formatRelative } from '../lib/text';
import PageBar from './PageBar';

const TRASH_DAYS = 30;

export default function TrashView() {
  const { trashed, store, restoreMemo, toast } = useApp();

  const daysLeft = (m) => Math.max(0, TRASH_DAYS - Math.floor((Date.now() - m.deletedAt) / 86400000));

  const purge = async (m) => {
    if (!confirm(`‘${memoTitle(m)}’을(를) 영구 삭제할까요? 되돌릴 수 없습니다.`)) return;
    await store.deleteMemo(m.id);
  };

  const emptyAll = async () => {
    if (!confirm(`휴지통의 메모 ${trashed.length}개를 모두 영구 삭제할까요?`)) return;
    await Promise.all(trashed.map((m) => store.deleteMemo(m.id)));
    toast('휴지통을 비웠어요');
  };

  return (
    <>
      <PageBar back="/" crumbs={[{ label: '모든 메모', href: '/' }, { label: '휴지통' }]}>
        {trashed.length > 0 && <button className="btn btn-sm btn-ghost danger-text" onClick={emptyAll}>비우기</button>}
      </PageBar>
      <div className="page page-narrow">
        <header className="page-head">
          <div>
            <h1 className="page-title">휴지통</h1>
            <p className="page-sub">삭제한 메모는 {TRASH_DAYS}일 동안 보관돼요.</p>
          </div>
        </header>
        {!trashed.length ? (
          <div className="empty"><p className="empty-sub">휴지통이 비어 있어요.</p></div>
        ) : (
          <div className="study-list">
            {trashed.map((m) => (
              <div key={m.id} className="study-row trash-row">
                <span className="study-row-name">{memoTitle(m)}</span>
                <span className="muted">{formatRelative(m.deletedAt)} 삭제 · {daysLeft(m)}일 남음</span>
                <button className="btn btn-sm" onClick={() => restoreMemo(m.id)}><RotateCcw size={13} /> 복원</button>
                <button className="icon-btn icon-btn-sm" onClick={() => purge(m)} aria-label="영구 삭제" title="영구 삭제"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
