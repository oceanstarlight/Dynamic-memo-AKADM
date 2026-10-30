import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createFirestoreStore, createMemoryStore } from './lib/store';
import { DEFAULT_SETTINGS, loadLocalSettings, saveLocalSettings } from './lib/settings';
import { analyzeMemo, makeStudySet, GEMINI_MODEL } from './lib/gemini';
import { findCategoryByName, matchExistingCategory, normalizeName, pickColor } from './lib/categories';
import { hashText } from './lib/text';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const MIN_AI_LENGTH = 15;

export function AppProvider({ session, onSignOut, children }) {
  const isGuest = session.kind === 'guest';
  const store = useMemo(
    () => (isGuest ? createMemoryStore() : createFirestoreStore(session.user.uid)),
    [isGuest, session.user?.uid],
  );

  const [memos, setMemos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState({ memos: false, cats: false });
  const [settings, setSettings] = useState(loadLocalSettings);
  const [busy, setBusy] = useState({}); // { [memoId]: 'analyze' | 'study' }
  const [toasts, setToasts] = useState([]);

  // 콜백 안에서 최신 목록을 읽기 위한 ref
  const catsRef = useRef(categories);
  catsRef.current = categories;
  const memosRef = useRef(memos);
  memosRef.current = memos;

  useEffect(() => {
    const onError = (error) => {
      console.error(error);
      toast(`동기화 오류: ${error.message}`, { tone: 'error' });
    };
    const offMemos = store.subscribeMemos((list) => {
      setMemos(list);
      setLoaded((l) => ({ ...l, memos: true }));
    }, onError);
    const offCats = store.subscribeCategories((list) => {
      setCategories(list);
      setLoaded((l) => ({ ...l, cats: true }));
    }, onError);
    store.loadSettings().then((remote) => {
      if (remote) setSettings((s) => ({ ...s, ...remote }));
    }).catch(() => {});
    return () => { offMemos(); offCats(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  // ---------------- 토스트 ----------------
  const toast = useCallback((message, { tone = 'default', action, duration = 4200 } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list.slice(-3), { id, message, tone, action }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), duration);
  }, []);
  const dismissToast = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  // ---------------- 설정 ----------------
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveLocalSettings(next);
      store.saveSettings(next).catch(() => {});
      return next;
    });
  }, [store]);

  // 게스트는 자동 저장을 쓰지 않는다
  const effectiveSettings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...settings, autoSave: isGuest ? false : settings.autoSave }),
    [settings, isGuest],
  );

  const setBusyFor = (memoId, value) => setBusy((b) => {
    const next = { ...b };
    if (value) next[memoId] = value; else delete next[memoId];
    return next;
  });

  // ---------------- 카테고리 ----------------
  const ensureCategory = useCallback(async (name, { createdBy = 'user' } = {}) => {
    const clean = normalizeName(name);
    if (!clean) return null;
    const existing = findCategoryByName(catsRef.current, clean);
    if (existing) return existing.id;
    const list = catsRef.current;
    return store.createCategory({
      name: clean,
      color: pickColor(list),
      order: list.reduce((max, c) => Math.max(max, c.order ?? 0), -1) + 1,
      createdBy,
    });
  }, [store]);

  const moveMemoToCategory = useCallback(async (memoId, categoryId) => {
    await store.patchMemo(memoId, { categoryId: categoryId || null, categoryManual: true });
  }, [store]);

  // ---------------- AI: 분석 ----------------
  // categorize: 설정과 상관없이 카테고리 적용 여부를 지정 (파일 'AI 자동 분류'처럼 사용자가 명시적으로 요청한 경우)
  const runAnalysis = useCallback(async (memoId, { text, title }, { force = false, categorize, silent = false } = {}) => {
    if ((text || '').trim().length < MIN_AI_LENGTH) {
      if (force) toast(`본문이 너무 짧아서 분석하지 않았어요 (${MIN_AI_LENGTH}자 이상).`);
      return null;
    }
    const memo = memosRef.current.find((m) => m.id === memoId);
    const sourceHash = hashText(text);
    if (!force && memo?.ai?.sourceHash === sourceHash) return memo.ai;

    setBusyFor(memoId, 'analyze');
    try {
      // 카테고리마다 최근 메모 제목 몇 개를 같이 보내서 기존 카테고리에 잘 들어가게 한다
      const categoryHints = catsRef.current.map((c) => ({
        name: c.name,
        examples: memosRef.current.filter((m) => m.categoryId === c.id && m.id !== memoId && m.title).slice(0, 3).map((m) => m.title.slice(0, 30)),
      }));
      const result = await analyzeMemo({ text, categories: categoryHints });
      const { title: aiTitle, ...ai } = result;
      const match = ai.category && matchExistingCategory(catsRef.current, ai.category);
      if (match) {
        ai.category = match.name;
        ai.isNewCategory = false;
      }
      const s = effectiveSettings;
      const patch = {
        ai: { ...ai, title: aiTitle, sourceHash, model: GEMINI_MODEL, analyzedAt: Date.now() },
        tags: ai.tags,
        aiError: undefined,
      };
      if (s.autoTitle && !(title || '').trim() && aiTitle) patch.title = aiTitle;

      let placedName = null;
      // 이미 사용자가 직접 카테고리를 정한 메모는 건드리지 않는다
      if (ai.category && (categorize ?? s.autoCategorize) && !memo?.categoryManual) {
        const categoryId = await ensureCategory(ai.category, { createdBy: 'ai' });
        patch.categoryId = categoryId;
        placedName = ai.category;
      }
      await store.patchMemo(memoId, patch);

      // silent면 결과 안내는 호출한 쪽(파일 불러오기 창 등)이 한다
      if (!silent && placedName) {
        toast(`‘${placedName}’에 분류했어요${ai.isNewCategory ? ' · 새 카테고리' : ''}`, {
          action: { label: '열기', href: `/m/${memoId}` },
        });
      } else if (!silent && !ai.category) {
        toast('분류할 만한 내용이 부족해서 미분류로 뒀어요. 카테고리는 직접 정할 수 있어요.');
      } else if (!silent) {
        toast(`AI 제안: ‘${ai.category}’ — 메모 오른쪽 패널에서 적용할 수 있어요.`);
      }
      return patch.ai;
    } catch (error) {
      console.error(error);
      store.patchMemo(memoId, { aiError: error.message }).catch(() => {});
      toast(`AI 정리 실패: ${error.message}`, { tone: 'error', duration: 6000 });
      return null;
    } finally {
      setBusyFor(memoId, null);
    }
  }, [store, effectiveSettings, ensureCategory, toast]);

  const applySuggestedCategory = useCallback(async (memoId) => {
    const memo = memosRef.current.find((m) => m.id === memoId);
    if (!memo?.ai?.category) return;
    const categoryId = await ensureCategory(memo.ai.category, { createdBy: 'ai' });
    await store.patchMemo(memoId, { categoryId, categoryManual: false });
    toast(`‘${memo.ai.category}’에 분류했어요`);
  }, [ensureCategory, store, toast]);

  // ---------------- AI: 학습 세트 (분석과 별도 호출) ----------------
  const runStudy = useCallback(async (memoId, { text }, { force = false } = {}) => {
    if ((text || '').trim().length < MIN_AI_LENGTH) {
      if (force) toast('학습 카드를 만들기엔 본문이 너무 짧아요.');
      return null;
    }
    const memo = memosRef.current.find((m) => m.id === memoId);
    const sourceHash = hashText(text);
    if (!force && memo?.study?.sourceHash === sourceHash) return memo.study;

    setBusyFor(memoId, 'study');
    try {
      const set = await makeStudySet(text);
      const study = { ...set, sourceHash, createdAt: Date.now() };
      await store.patchMemo(memoId, { study });
      if (force) toast(`플래시카드 ${set.cards.length}장 · 퀴즈 ${set.quiz.length}문제를 만들었어요`, { action: { label: '학습하기', href: `/study/m/${memoId}` } });
      return study;
    } catch (error) {
      console.error(error);
      toast(`학습 카드 생성 실패: ${error.message}`, { tone: 'error', duration: 6000 });
      return null;
    } finally {
      setBusyFor(memoId, null);
    }
  }, [store, toast]);

  const value = {
    session, isGuest, store, onSignOut,
    memos, categories, loaded: loaded.memos && loaded.cats,
    settings: effectiveSettings, updateSettings,
    busy, toasts, toast, dismissToast,
    ensureCategory, moveMemoToCategory, runAnalysis, applySuggestedCategory, runStudy,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
