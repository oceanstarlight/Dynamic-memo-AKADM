import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { AppProvider, useApp } from './AppContext';
import { useRoute } from './lib/router';
import { useTheme } from './lib/useTheme';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import HomeView from './components/HomeView';
import CategoryView from './components/CategoryView';
import MemoView from './editor/MemoView';
import StudyView from './components/StudyView';
import Toasts from './components/Toasts';
import SearchPalette from './components/SearchPalette';
import SettingsDialog from './components/SettingsDialog';
import NewMemo from './components/NewMemo';

export default function App() {
  // session: undefined(확인 중) | null(로그아웃) | { kind: 'user', user } | { kind: 'guest' }
  const [session, setSession] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setSession((prev) => (user ? { kind: 'user', user } : prev?.kind === 'guest' ? prev : null));
  }), []);

  const handleSignOut = async () => {
    if (session?.kind === 'guest') {
      if (!confirm('게스트 메모는 저장되지 않아요. 나가면 모두 사라지는데 괜찮아?')) return;
      setSession(null);
      return;
    }
    await signOut(auth);
  };

  if (session === undefined) return <div className="boot" aria-busy="true" />;
  if (!session) return <Login onGuest={() => setSession({ kind: 'guest' })} />;

  return (
    <AppProvider key={session.kind === 'guest' ? 'guest' : session.user.uid} session={session} onSignOut={handleSignOut}>
      <Shell />
    </AppProvider>
  );
}

function Shell() {
  const { parts } = useRoute();
  const { settings, isGuest } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  useTheme(settings.theme);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 게스트는 새로고침/닫기 시 데이터가 사라진다고 알려준다
  useEffect(() => {
    if (!isGuest) return undefined;
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isGuest]);

  useEffect(() => setNavOpen(false), [parts.join('/')]);

  let view;
  const [section, id, sub] = parts;
  if (section === 'm' && id) view = <MemoView key={id} memoId={id} />;
  else if (section === 'new') view = <NewMemo />;
  else if (section === 'c' && id) view = <CategoryView key={id} categoryId={id} />;
  else if (section === 'study') view = <StudyView key={`${id}-${sub}`} scope={id} targetId={sub} />;
  else view = <HomeView />;

  return (
    <div className={`shell${navOpen ? ' nav-open' : ''}`}>
      <Sidebar
        onSearch={() => setSearchOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onClose={() => setNavOpen(false)}
      />
      <div className="scrim" onClick={() => setNavOpen(false)} />
      <main className="main">
        <button className="nav-toggle icon-btn" onClick={() => setNavOpen(true)} aria-label="메뉴 열기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
        </button>
        {view}
      </main>
      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      <Toasts />
    </div>
  );
}
