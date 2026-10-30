import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// 기존 my-memo-app과 같은 Firebase 프로젝트 (웹 config는 공개값이라 코드에 둬도 된다)
const firebaseConfig = {
  apiKey: 'AIzaSyAYEJAdYUOKTX34-e6E69pbtH94uYHVFnA',
  authDomain: 'my-memo-app-bc3c5.firebaseapp.com',
  projectId: 'my-memo-app-bc3c5',
  storageBucket: 'my-memo-app-bc3c5.firebasestorage.app',
  messagingSenderId: '882940407651',
  appId: '1:882940407651:web:5160b3faee7930334fad56',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 오프라인 캐시: 네트워크가 끊겨도 쓰기가 로컬에 남았다가 재연결 시 올라간다
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
});

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
