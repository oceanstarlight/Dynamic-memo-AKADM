import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';

// background.js와 같은 키를 쓴다
export const CLIP_KEY = 'dm-clips'; // chrome.storage.local: 우클릭으로 담은 글 대기열
const CLIP_LOCK = 'dm-clips';
const ROUTE_KEY = 'dm-open-route'; // chrome.storage.session: 사이드 패널이 열자마자 이동할 화면

// Chrome에 로그인된 Google 계정의 토큰으로 Firebase에 로그인 (웹앱과 같은 계정 · 같은 메모)
export async function signInWithChromeGoogle() {
  const result = await chrome.identity.getAuthToken({ interactive: true });
  const token = typeof result === 'string' ? result : result?.token;
  if (!token) throw new Error('Google 토큰을 받지 못했습니다.');
  try {
    return await signInWithCredential(auth, GoogleAuthProvider.credential(null, token));
  } catch (error) {
    // 만료 · 취소된 토큰이 캐시에 남아 있으면 다음 시도도 실패하므로 지운다
    await chrome.identity.removeCachedAuthToken({ token }).catch(() => {});
    throw error;
  }
}

// 사이드 패널 열기. sidePanel.open은 사용자 동작 직후에만 되므로 await 없이 먼저 부른다
export function openSidePanel(windowId, route) {
  const opening = chrome.sidePanel.open({ windowId });
  if (route) chrome.storage.session.set({ [ROUTE_KEY]: route });
  return opening;
}

export async function takeOpenRoute() {
  const { [ROUTE_KEY]: route } = await chrome.storage.session.get(ROUTE_KEY);
  if (route) await chrome.storage.session.remove(ROUTE_KEY);
  return route || null;
}

export function onOpenRoute(callback) {
  const listener = (changes, area) => {
    if (area === 'session' && changes[ROUTE_KEY]?.newValue) callback();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

// 대기열을 비우고 꺼낸다. 창마다 열린 사이드 패널이 같은 글을 두 번 저장하지 않게 Web Lock으로 감싼다
export function takeClips() {
  return navigator.locks.request(CLIP_LOCK, async () => {
    const { [CLIP_KEY]: clips = [] } = await chrome.storage.local.get(CLIP_KEY);
    if (clips.length) await chrome.storage.local.set({ [CLIP_KEY]: [] });
    return clips;
  });
}

export function onClipsAdded(callback) {
  const listener = (changes, area) => {
    if (area === 'local' && changes[CLIP_KEY]?.newValue?.length) callback();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
