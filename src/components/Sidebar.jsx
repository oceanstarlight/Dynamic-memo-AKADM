import { useState } from 'react';
import { Search, SquarePen, Inbox, GraduationCap, Plus, Settings, LogOut, ChevronDown, CloudOff, FileUp } from 'lucide-react';
import { useApp } from '../AppContext';
import { navigate, openImport, useRoute } from '../lib/router';
import { CategoryDot, Popover } from './common';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ onSearch, onSettings, onClose }) {
  const { session, isGuest, memos, categories, ensureCategory, onSignOut, toast } = useApp();
  const { parts } = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const counts = new Map();
  memos.forEach((m) => counts.set(m.categoryId || 'none', (counts.get(m.categoryId || 'none') || 0) + 1));
  const uncategorized = counts.get('none') || 0;

  const name = isGuest ? '게스트' : (session.user.displayName || session.user.email || '내 메모');
  const photo = !isGuest && session.user.photoURL;
  const active = (path) => parts.join('/') === path;

  const submitCategory = async (e) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) { setAdding(false); return; }
    try {
      const id = await ensureCategory(clean);
      setNewName('');
      setAdding(false);
      navigate(`/c/${id}`);
    } catch (error) {
      toast(`카테고리를 만들지 못했어요: ${error.message}`, { tone: 'error' });
    }
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
          <button className="menu-item" onClick={() => { setMenuOpen(false); onSettings(); }}><Settings size={15} /> 설정</button>
          <button className="menu-item" onClick={() => { setMenuOpen(false); onSignOut(); }}><LogOut size={15} /> {isGuest ? '게스트 종료' : '로그아웃'}</button>
        </Popover>
      </div>

      <nav className="sb-nav">
        <button className="sb-item" onClick={onSearch}>
          <Search size={16} /> <span>검색</span> <kbd>⌘K</kbd>
        </button>
        <button className="sb-item" onClick={() => navigate('/new')}>
          <SquarePen size={16} /> <span>새 메모</span>
        </button>
        <button className="sb-item" onClick={openImport}>
          <FileUp size={16} /> <span>파일 불러오기</span>
        </button>
        <a className={`sb-item${active('') ? ' active' : ''}`} href="#/">
          <Inbox size={16} /> <span>모든 메모</span> <span className="sb-count">{memos.length || ''}</span>
        </a>
        <a className={`sb-item${parts[0] === 'study' ? ' active' : ''}`} href="#/study">
          <GraduationCap size={16} /> <span>학습</span>
        </a>
      </nav>

      <div className="sb-section">
        <div className="sb-section-head">
          <span>카테고리</span>
          <button className="icon-btn icon-btn-sm" onClick={() => setAdding(true)} aria-label="카테고리 추가"><Plus size={14} /></button>
        </div>
        <div className="sb-list">
          {categories.map((c) => (
            <a key={c.id} className={`sb-item sb-cat${active(`c/${c.id}`) ? ' active' : ''}`} href={`#/c/${c.id}`}>
              <CategoryDot color={c.color} />
              <span className="ellipsis">{c.name}</span>
              <span className="sb-count">{counts.get(c.id) || ''}</span>
            </a>
          ))}
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
          {uncategorized > 0 && (
            <a className={`sb-item sb-cat${active('c/none') ? ' active' : ''}`} href="#/c/none">
              <CategoryDot color="none" />
              <span>미분류</span>
              <span className="sb-count">{uncategorized}</span>
            </a>
          )}
          {!categories.length && !adding && <p className="sb-empty">메모를 완료하면 AI가 카테고리를 만들어요.</p>}
        </div>
      </div>

      {isGuest && (
        <div className="sb-guest">
          <CloudOff size={14} />
          <span>게스트 모드 · 저장 버튼으로만 저장되고, 탭을 닫으면 사라져요.</span>
        </div>
      )}
    </aside>
  );
}
