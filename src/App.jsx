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
import ImportDialog from './components/ImportDialog';
import AskView from './components/AskView';
import TodoView from './components/TodoView';
import TrashView from './components/TrashView';

export default function App() {
  // session: undefined(확인 중) | null(로그아웃) | { kind: 'user', user } | { kind: 'guest' }
  const [session, setSession] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setSession((prev) => (user ? { kind: 'user', user } : prev?.kind === 'guest' ? prev : null));
  }), []);

  const handleSignOut = async () => {
    if (session?.kind === 'guest') {
      if (!confirm('게스트 메모는 저장되지 않아요. 나가면 모두 사라지는데 괜찮을까요?')) return;
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
  const [importOpen, setImportOpen] = useState(false);
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

  // 어느 화면에서든 '파일 불러오기' 창과 모바일 메뉴를 열 수 있게
  useEffect(() => {
    const openImportDialog = () => setImportOpen(true);
    const openNavMenu = () => setNavOpen(true);
    window.addEventListener('dm:import', openImportDialog);
    window.addEventListener('dm:nav', openNavMenu);
    return () => {
      window.removeEventListener('dm:import', openImportDialog);
      window.removeEventListener('dm:nav', openNavMenu);
    };
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
  else if (section === 'ask') view = <AskView />;
  else if (section === 'todos') view = <TodoView />;
  else if (section === 'trash') view = <TrashView />;
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
        {view}
      </main>
      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      {importOpen && <ImportDialog onClose={() => setImportOpen(false)} />}
      <Toasts />
    </div>
  );
}
