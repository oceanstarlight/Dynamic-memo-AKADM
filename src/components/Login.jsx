import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../lib/firebase';
import { GoogleIcon, GithubIcon } from './BrandIcons';

const ERRORS = {
  'auth/account-exists-with-different-credential': '같은 이메일로 다른 방식(구글/깃허브)으로 가입된 계정이 있어요. 처음 가입한 방식으로 로그인해 줘.',
  'auth/popup-blocked': '팝업이 차단됐어요. 브라우저에서 팝업을 허용해 줘.',
  'auth/unauthorized-domain': '이 도메인이 Firebase 승인 도메인에 없어요. (Firebase 콘솔 → Authentication → 설정)',
  'auth/operation-not-allowed': '이 로그인 방식이 Firebase에서 꺼져 있어요. (Firebase 콘솔 → Authentication → 로그인 방법)',
};

export default function Login({ onGuest }) {
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');

  const signIn = async (provider, key) => {
    setPending(key);
    setError('');
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        setError(ERRORS[e.code] || e.message);
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="currentColor" /><path d="M9 22V10l7 7 7-7v12" stroke="var(--bg)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1>Dynamic Memo</h1>
        <p className="login-lead">쓰기만 하면 돼요. 분류와 요약, 복습 카드는 알아서 정리해 둘게요.</p>

        <div className="login-actions">
          <button className="btn btn-outline btn-lg" disabled={!!pending} onClick={() => signIn(googleProvider, 'google')}>
            <GoogleIcon /> {pending === 'google' ? '로그인 중…' : 'Google로 계속하기'}
          </button>
          <button className="btn btn-outline btn-lg" disabled={!!pending} onClick={() => signIn(githubProvider, 'github')}>
            <GithubIcon /> {pending === 'github' ? '로그인 중…' : 'GitHub로 계속하기'}
          </button>
          <div className="login-divider"><span>또는</span></div>
          <button className="btn btn-ghost btn-lg" disabled={!!pending} onClick={onGuest}>
            게스트로 둘러보기
          </button>
          <p className="login-note">게스트 메모는 이 탭에만 있고, 자동 저장되지 않아요.</p>
        </div>

        {error && <p className="login-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}
