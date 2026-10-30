// 메모/카테고리 저장소. 로그인 사용자는 Firestore, 게스트는 브라우저 메모리만 사용한다.
// 두 구현은 같은 인터페이스를 가진다.
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc, writeBatch, serverTimestamp, deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { plainToHtml } from './text';

// 이전 앱 데이터(content: plain text, folderId)도 읽을 수 있게 정규화
function normalizeMemo(id, data) {
  const html = data.html ?? plainToHtml(data.content || '');
  return {
    id,
    ...data,
    html,
    text: data.text ?? data.content ?? '',
    categoryId: data.categoryId ?? null,
    tags: data.tags || data.ai?.tags || [],
    status: data.status || (data.ai ? 'done' : 'draft'),
  };
}

const byUpdatedDesc = (a, b) => (b._sortTime || 0) - (a._sortTime || 0);
const sortTime = (m) => {
  const ts = m.updatedAt || m.createdAt;
  return ts?.toMillis ? ts.toMillis() : (typeof ts === 'number' ? ts : Date.now());
};

export function createFirestoreStore(uid) {
  const userRef = doc(db, 'users', uid);
  const memosCol = collection(userRef, 'memos');
  const catsCol = collection(userRef, 'categories');

  return {
    kind: 'cloud',
    newMemoId: () => doc(memosCol).id,

    subscribeMemos(cb, onError) {
      // 정렬 필드가 없는 예전 문서도 빠지지 않게 전체를 받아 클라이언트에서 정렬
      return onSnapshot(memosCol, (snap) => {
        const memos = snap.docs.map((d) => {
          const m = normalizeMemo(d.id, d.data({ serverTimestamps: 'estimate' }));
          m._sortTime = sortTime(m);
          return m;
        });
        cb(memos.sort(byUpdatedDesc));
      }, onError);
    },

    subscribeCategories(cb, onError) {
      return onSnapshot(catsCol, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      }, onError);
    },

    async saveMemo(id, data, { isNew = false } = {}) {
      const payload = { ...data, updatedAt: serverTimestamp() };
      if (isNew) payload.createdAt = serverTimestamp();
      await setDoc(doc(memosCol, id), payload, { merge: true });
    },

    // 분석 결과처럼 "문서가 있을 때만" 반영해야 하는 업데이트 (삭제된 메모 부활 방지)
    async patchMemo(id, patch) {
      const clean = Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v === undefined ? deleteField() : v]));
      await updateDoc(doc(memosCol, id), clean);
    },

    async deleteMemo(id) {
      await deleteDoc(doc(memosCol, id));
    },

    async createCategory(data) {
      const ref = doc(catsCol);
      await setDoc(ref, { ...data, createdAt: serverTimestamp() });
      return ref.id;
    },

    async updateCategory(id, patch) {
      await updateDoc(doc(catsCol, id), patch);
    },

    // 카테고리를 지우면 안의 메모는 미분류로 옮긴다
    async deleteCategory(id, memoIds) {
      const ops = [...memoIds.map((mid) => ['memo', mid]), ['cat', id]];
      for (let i = 0; i < ops.length; i += 450) {
        const batch = writeBatch(db);
        ops.slice(i, i + 450).forEach(([type, key]) => {
          if (type === 'memo') batch.update(doc(memosCol, key), { categoryId: null });
          else batch.delete(doc(catsCol, key));
        });
        await batch.commit();
      }
    },

    async loadSettings() {
      const snap = await getDoc(userRef);
      return snap.exists() ? snap.data().settings || null : null;
    },

    async saveSettings(settings) {
      await setDoc(userRef, { settings }, { merge: true });
    },
  };
}

export function createMemoryStore() {
  const memos = new Map();
  const cats = new Map();
  const memoListeners = new Set();
  const catListeners = new Set();
  let seq = 0;
  const newId = () => `local-${Date.now().toString(36)}-${(seq++).toString(36)}`;

  const emitMemos = () => {
    const list = [...memos.values()].map((m) => ({ ...m, _sortTime: m.updatedAt })).sort(byUpdatedDesc);
    memoListeners.forEach((cb) => cb(list));
  };
  const emitCats = () => {
    const list = [...cats.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    catListeners.forEach((cb) => cb(list));
  };
  const tick = (fn) => Promise.resolve().then(fn);

  return {
    kind: 'memory',
    newMemoId: newId,

    subscribeMemos(cb) {
      memoListeners.add(cb);
      tick(emitMemos);
      return () => memoListeners.delete(cb);
    },
    subscribeCategories(cb) {
      catListeners.add(cb);
      tick(emitCats);
      return () => catListeners.delete(cb);
    },

    async saveMemo(id, data, { isNew = false } = {}) {
      const prev = memos.get(id);
      const now = Date.now();
      memos.set(id, normalizeMemo(id, { ...(prev || {}), ...data, updatedAt: now, createdAt: prev?.createdAt ?? now }));
      emitMemos();
    },
    async patchMemo(id, patch) {
      const prev = memos.get(id);
      if (!prev) throw new Error('메모가 없어요');
      const next = { ...prev, ...patch };
      Object.keys(patch).forEach((k) => { if (patch[k] === undefined) delete next[k]; });
      memos.set(id, normalizeMemo(id, next));
      emitMemos();
    },
    async deleteMemo(id) {
      memos.delete(id);
      emitMemos();
    },

    async createCategory(data) {
      const id = newId();
      cats.set(id, { id, ...data, createdAt: Date.now() });
      emitCats();
      return id;
    },
    async updateCategory(id, patch) {
      cats.set(id, { ...cats.get(id), ...patch });
      emitCats();
    },
    async deleteCategory(id, memoIds) {
      memoIds.forEach((mid) => { if (memos.has(mid)) memos.set(mid, { ...memos.get(mid), categoryId: null }); });
      cats.delete(id);
      emitCats();
      emitMemos();
    },

    async loadSettings() { return null; },
    async saveSettings() {},
  };
}
