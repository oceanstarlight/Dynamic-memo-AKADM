import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../src/App';
import { navigate } from '../../src/lib/router';
import ClipInbox from './ClipInbox';
import { onOpenRoute, takeOpenRoute } from './chromeApi';
import '../../src/styles.css';

// 사이드 패널 = 웹앱 전체. 팝업에서 '열기'를 누르면 그 메모 화면으로 이동한다
function RouteInbox() {
  useEffect(() => {
    const go = () => takeOpenRoute().then((route) => route && navigate(route));
    go();
    return onOpenRoute(go);
  }, []);
  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouteInbox />
    <App extras={<ClipInbox />} />
  </StrictMode>,
);
