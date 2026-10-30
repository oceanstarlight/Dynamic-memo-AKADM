import { useState } from 'react';
import { GoogleIcon } from '../../src/components/BrandIcons';
import { signInWithChromeGoogle } from './chromeApi';

// 확장용 로그인 화면 (웹의 Login.jsx 대신 빌드에 들어간다). Google 로그인 + 게스트
function describe(error) {
  const msg = error?.message || String(error);
  if (/did not approve|canceled|cancelled/i.test(msg)) return '';
  if (/client id|oauth2/i.test(msg)) return '확장의 Google 로그인 설정(OAuth 클라이언트 ID)이 아직 완료되지 않았습니다. EXTENSION.md 2단계를 확인해 주세요.';
  if (/not signed in|sign in to chrome/i.test(msg)) return 'Chrome에 Google 계정으로 로그인한 뒤 다시 시도해 주세요.';
  if (error?.code === 'auth/invalid-credential') return '로그인 정보가 만료되었습니다. 다시 시도해 주세요.';
  return msg;
}

export default function ExtLogin({ onGuest }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const signIn = async () => {
    setPending(true);
    setError('');
    try {
      await signInWithChromeGoogle();
    } catch (e) {
      setError(describe(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="currentColor" /><path d="M9 22V10l7 7 7-7v12" stroke="var(--bg)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1>Dynamic Memo</h1>
        <p className="login-lead">쓰기만 하세요. 분류와 요약, 복습 카드는 알아서 정리해 드릴게요.</p>

        <div className="login-actions">
          <button className="btn btn-outline btn-lg" disabled={pending} onClick={signIn}>
            <GoogleIcon /> {pending ? '로그인 중…' : 'Google로 계속하기'}
          </button>
          <div className="login-divider"><span>또는</span></div>
          <button className="btn btn-ghost btn-lg" disabled={pending} onClick={onGuest}>
            게스트로 둘러보기
          </button>
          <p className="login-note">Chrome에 로그인된 Google 계정을 사용합니다. 웹에서 GitHub로 가입하셨다면 웹앱을 이용해 주세요.</p>
        </div>

        {error && <p className="login-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}
