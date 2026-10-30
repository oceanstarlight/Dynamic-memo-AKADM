import { useState } from 'react';
import {
  Search, SquarePen, Inbox, GraduationCap, Plus, Settings, LogOut, ChevronDown, ChevronRight, CloudOff, FileUp,
  MessageCircleQuestion, ListChecks, Trash2, Pin, ArrowRight,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { navigate, openImport, useRoute } from '../lib/router';
import { memoTitle } from '../lib/text';
import { CategoryDot, Popover } from './common';
import ThemeToggle from './ThemeToggle';

const OPEN_KEY = 'dm-sb-open';
const loadOpen = () => {
  try { return new Set(JSON.parse(localStorage.getItem(OPEN_KEY) || '[]')); } catch { return new Set(); }
};
const MAX_CHILDREN = 30;

export default function Sidebar({ onSearch, onSettings, onClose }) {
  const { session, isGuest, memos, trashed, categories, ensureCategory, onSignOut, toast, settings } = useApp();
  const { parts } = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(loadOpen);

  const byCategory = new Map();
  memos.forEach((m) => {
    const key = m.categoryId && categories.some((c) => c.id === m.categoryId) ? m.categoryId : 'none';
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(m);
  });
  const pinned = memos.filter((m) => m.pinned);

  const name = isGuest ? '게스트' : (session.user.displayName || session.user.email || '내 메모');
  const photo = !isGuest && session.user.photoURL;
  const here = parts.join('/');
  const go = (path) => { navigate(path); onClose(); };

  // 카테고리를 누르면 아래로 펼쳐져 메모 목록이 보인다 (페이지 이동 없음)
  const toggle = (id) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(OPEN_KEY, JSON.stringify([...next])); } catch { /* 무시 */ }
      return next;
    });
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) { setAdding(false); return; }
    try {
      const id = await ensureCategory(clean);
      setNewName('');
      setAdding(false);
      setOpen((prev) => new Set(prev).add(id));
    } catch (error) {
      toast(`카테고리를 만들지 못했어요: ${error.message}`, { tone: 'error' });
    }
  };

  const NavButton = ({ path, icon: Icon, label, count, onClick }) => (
    <button className={`sb-item${path !== undefined && here === path ? ' current' : ''}`} onClick={onClick || (() => go(`/${path}`))}>
      <Icon size={16} /> <span>{label}</span>
      {count ? <span className="sb-count">{count}</span> : null}
    </button>
  );

  const renderGroup = (id, label, color) => {
    const list = byCategory.get(id) || [];
    const isOpen = open.has(id);
    return (
      <div key={id} className="sb-group">
        <button className="sb-item sb-cat" onClick={() => toggle(id)} aria-expanded={isOpen}>
          {isOpen ? <ChevronDown size={14} className="sb-chev" /> : <ChevronRight size={14} className="sb-chev" />}
          <CategoryDot color={color} />
          <span className="ellipsis">{label}</span>
          <span className="sb-count">{list.length || ''}</span>
        </button>
        {isOpen && (
          <div className="sb-children">
            {list.slice(0, MAX_CHILDREN).map((m) => (
              <button key={m.id} className={`sb-child${here === `m/${m.id}` ? ' current' : ''}`} onClick={() => go(`/m/${m.id}`)}>
                <span className="ellipsis">{memoTitle(m)}</span>
              </button>
            ))}
            {!list.length && <span className="sb-child sb-child-empty">메모 없음</span>}
            <button className="sb-child sb-child-more" onClick={() => go(`/c/${id}`)}>
              {list.length > MAX_CHILDREN ? `전체 ${list.length}개 보기` : '카테고리 열기'} <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sb-top">
        <button className="sb-account" onClick={() => setMenuOpen((v) => !v)}>
          {photo ? <img src={photo} alt="" className="avatar" referrerPolicy="no-referrer" /> : <span className="avatar avatar-fallback">{name.slice(0, 1)}</span>}
          <span className="sb-account-name">{name}</span>
          <ChevronDown size={14} className="muted" />
        </button>
        <ThemeToggle />
        <button className="icon-btn sb-close" onClick={onClose} aria-label="메뉴 닫기">×</button>
        <Popover open={menuOpen} onClose={() => setMenuOpen(false)} className="sb-menu">
          {!isGuest && <div className="menu-caption">{session.user.email}</div>}
          <button className="menu-item" onClick={() => { setMenuOpen(false); onClose(); onSettings(); }}><Settings size={15} /> 설정</button>
          <button className="menu-item" onClick={() => { setMenuOpen(false); onSignOut(); }}><LogOut size={15} /> {isGuest ? '게스트 종료' : '로그아웃'}</button>
        </Popover>
      </div>

      <nav className="sb-nav">
        <button className="sb-item" onClick={() => { onClose(); onSearch(); }}>
          <Search size={16} /> <span>검색</span> <kbd>⌘K</kbd>
        </button>
        <NavButton path="new" icon={SquarePen} label="새 메모" />
        <NavButton icon={FileUp} label="파일 불러오기" onClick={() => { onClose(); openImport(); }} />
        <NavButton path="" icon={Inbox} label="모든 메모" count={memos.length} />
        {settings.askNotes && <NavButton path="ask" icon={MessageCircleQuestion} label="메모에게 질문" />}
        {settings.todoView && <NavButton path="todos" icon={ListChecks} label="할 일" />}
        <NavButton path="study" icon={GraduationCap} label="학습" />
      </nav>

      {pinned.length > 0 && (
        <div className="sb-section">
          <div className="sb-section-head"><span>고정됨</span></div>
          <div className="sb-list">
            {pinned.map((m) => (
              <button key={m.id} className={`sb-item sb-pinned${here === `m/${m.id}` ? ' current' : ''}`} onClick={() => go(`/m/${m.id}`)}>
                <Pin size={14} /> <span className="ellipsis">{memoTitle(m)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sb-section">
        <div className="sb-section-head">
          <span>카테고리</span>
          <button className="icon-btn icon-btn-sm" onClick={() => setAdding(true)} aria-label="카테고리 추가"><Plus size={14} /></button>
        </div>
        <div className="sb-list">
          {categories.map((c) => renderGroup(c.id, c.name, c.color))}
          {adding && (
            <form onSubmit={submitCategory} className="sb-add">
              <input
                autoFocus value={newName} placeholder="카테고리 이름"
                onChange={(e) => setNewName(e.target.value)}
                onBlur={submitCategory}
                onKeyDown={(e) => { if (e.key === 'Escape') { setNewName(''); setAdding(false); } }}
              />
            </form>
          )}
          {byCategory.has('none') && renderGroup('none', '미분류', 'none')}
          {!categories.length && !adding && <p className="sb-empty">메모를 완료하면 AI가 카테고리를 만들어요.</p>}
        </div>
      </div>

      <div className="sb-bottom">
        {(settings.useTrash || trashed.length > 0) && (
          <NavButton path="trash" icon={Trash2} label="휴지통" count={trashed.length} />
        )}
        {isGuest && (
          <div className="sb-guest">
            <CloudOff size={14} />
            <span>게스트 모드 · 저장 버튼으로만 저장되고, 탭을 닫으면 사라져요.</span>
          </div>
        )}
      </div>
    </aside>
  );
}
