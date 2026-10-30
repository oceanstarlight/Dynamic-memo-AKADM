import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { CornerDownLeft, PanelRight } from 'lucide-react';
import { auth } from '../../src/lib/firebase';
import { AppProvider, MIN_AI_LENGTH, useApp } from '../../src/AppContext';
import { useTheme } from '../../src/lib/useTheme';
import { loadLocalSettings } from '../../src/lib/settings';
import Toasts from '../../src/components/Toasts';
import { Spinner } from '../../src/components/common';
import { openSidePanel } from './chromeApi';
import '../../src/styles.css';
import './popup.css';

// 툴바 아이콘 팝업: 한 줄 메모 → 저장 · 자동 분류. 화면 이동이 필요한 동작은 사이드 패널로 넘긴다
let windowId = null;
chrome.windows.getCurrent().then((w) => { windowId = w.id; });

function openPanel(route) {
  if (windowId == null) return;
  openSidePanel(windowId, route).then(() => window.close()).catch(() => {});
}

// 토스트의 '열기'는 해시를 바꾸므로, 팝업에서는 그 화면을 사이드 패널로 연다
window.addEventListener('hashchange', () => {
  const route = window.location.hash.replace(/^#/, '');
  if (route) openPanel(route);
  window.history.replaceState(null, '', window.location.pathname);
});

function Header() {
  return (
    <header className="pop-head">
      <span className="pop-brand">
        <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="currentColor" /><path d="M9 22V10l7 7 7-7v12" stroke="var(--bg)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Dynamic Memo
      </span>
      <button className="btn btn-sm btn-ghost" onClick={() => openPanel('/')} title="사이드 패널에서 전체 앱 열기">
        <PanelRight size={14} /> 전체 앱
      </button>
    </header>
  );
}

function QuickPopup() {
  const { quickCapture, settings, toast, loaded } = useApp();
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | saving | analyzing
  const inputRef = useRef(null);
  useTheme(settings.theme);
  useEffect(() => inputRef.current?.focus(), []);

  const submit = async () => {
    const body = text.trim();
    if (!body || phase !== 'idle' || !loaded) return;
    const willAnalyze = settings.autoAnalyze && body.length >= MIN_AI_LENGTH;
    setPhase(willAnalyze ? 'analyzing' : 'saving');
    try {
      const memoId = await quickCapture(body, { wait: true });
      setText('');
      // 짧은 메모는 AI를 부르지 않아 따로 안내가 없으므로 여기서 알린다
      if (settings.autoAnalyze && !willAnalyze) toast('저장했어요', { action: { label: '열기', href: `/m/${memoId}` } });
    } catch (error) {
      toast(`저장 실패: ${error.message}`, { tone: 'error' });
    } finally {
      setPhase('idle');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="pop">
      <Header />
      <textarea
        ref={inputRef} className="pop-input" rows={6} value={text} disabled={phase !== 'idle'}
        placeholder="떠오른 생각을 바로 적어 두세요"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
        }}
      />
      <div className="pop-foot">
        <span className="pop-hint">
          {phase === 'analyzing' ? 'AI가 정리하는 중입니다. 창을 열어 두세요…'
            : settings.autoAnalyze ? 'Enter로 저장하면 AI가 분류해요 · Shift+Enter 줄바꿈' : 'Enter로 저장 · Shift+Enter 줄바꿈'}
        </span>
        <button className="btn btn-sm btn-primary" onClick={submit} disabled={!text.trim() || phase !== 'idle' || !loaded}>
          {phase !== 'idle' || !loaded ? <Spinner size={11} /> : <CornerDownLeft size={13} />} 저장
        </button>
      </div>
      <p className="pop-tip">웹페이지에서 글을 선택하고 우클릭하면 바로 메모로 저장할 수 있어요.</p>
      <Toasts />
    </div>
  );
}

function PopupApp() {
  const [user, setUser] = useState(undefined);
  useTheme(loadLocalSettings().theme);
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);

  if (user === undefined) return <div className="pop pop-boot" aria-busy="true" />;
  if (!user) {
    return (
      <div className="pop">
        <Header />
        <div className="pop-empty">
          <p>메모를 저장하려면 먼저 로그인해 주세요.</p>
          <button className="btn btn-primary" onClick={() => openPanel('/')}>사이드 패널에서 로그인</button>
        </div>
      </div>
    );
  }
  return (
    <AppProvider key={user.uid} session={{ kind: 'user', user }} onSignOut={() => signOut(auth)}>
      <QuickPopup />
    </AppProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
