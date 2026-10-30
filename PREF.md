# PREF — 코드 · 기능 색인

> 새 세션에서 "어디를 고치면 되지?"를 빠르게 찾기 위한 색인입니다.
> 기능 이름 → 파일 → 주요 함수 순서로 찾으세요. 줄 번호는 바뀔 수 있으니 함수 이름으로 검색하세요.
> 작업 기록은 [plans.md](plans.md), 작업 규칙은 [CLAUDE.md](CLAUDE.md)에 있습니다.

## 0. 빠른 찾기 (기능 → 파일)

| 찾는 것 | 파일 | 시작점 |
|---|---|---|
| 로그인 화면 · 오류 문구 | `src/components/Login.jsx` | `Login`, `ERRORS` |
| 라우팅 · 화면 분기 · 전역 단축키(⌘K) | `src/App.jsx` | `Shell` |
| 전역 상태 · AI 실행 · 휴지통 · 빠른 메모 | `src/AppContext.jsx` | `AppProvider`, `useApp` |
| **사이드바** (메뉴, 카테고리 트리, 고정, 휴지통) | `src/components/Sidebar.jsx` | `Sidebar`, `renderGroup`, `toggle` |
| **상단 바 · 뒤로가기** (모든 화면 공통) | `src/components/PageBar.jsx` | `PageBar`, `openNav` |
| 홈 (보드/목록, 카테고리→태그 필터, 고정, 빠른 메모) | `src/components/HomeView.jsx` | `HomeView`, `pickCategory` |
| 빠른 메모 입력창 | `src/components/QuickCapture.jsx` | `QuickCapture` |
| 카테고리 화면 · 개요 노트 · zip 내보내기 | `src/components/CategoryView.jsx` | `CategoryView`, `Overview` |
| **메모 편집 화면** (저장, 작성 완료, 패널, 도구 레일) | `src/editor/MemoView.jsx` | `MemoView`, `save`, `complete`, `openPanel` |
| 카테고리 선택 · 태그 편집 (메모 속성) | `src/editor/Properties.jsx` | `CategorySelect`, `TagEditor` |
| 서식 바 · 선택 메뉴 · `/` 메뉴 · 표/사진 메뉴 | `src/editor/FormatTools.jsx` | `FormatBar`, `SelectionBubble`, `useSlashMenu`, `BlockBubble` |
| 슬래시 블록 목록 · 하이라이트/글자 색 | `src/editor/blocks.js` | `BLOCKS`, `HIGHLIGHTS`, `TEXT_COLORS` |
| Tiptap 확장 (주석, 구분선 굵기), HTML 정제 | `src/editor/extensions.js` | `buildExtensions`, `Annotation`, `sanitizeHtml` |
| 요약 · 맞춤법 · AI 정리 · 학습 카드 패널 | `src/editor/AiPanels.jsx` | `InsightPanel`, `SpellPanel`, `TidyPanel`, `StudyPanel` |
| **음성 메모** (실시간 / 녹음 fallback) | `src/editor/VoicePanel.jsx` | `VoicePanel`, `VOICE_MODE`, `initialMode` |
| **AI 입력 예산** (긴 메모 자르기) | `src/lib/gemini.js` | `clipText`, `*_BUDGET` |
| 관련 메모 추천 | `src/components/RelatedMemos.jsx` | `score` |
| 메모에게 질문 | `src/components/AskView.jsx` | `pickMemos`, `AskView` |
| 할 일 모아보기 | `src/components/TodoView.jsx` | `extractTodos`, `setTodoChecked` |
| 휴지통 | `src/components/TrashView.jsx` | `TrashView` |
| 학습 (플래시카드 · 퀴즈) | `src/components/StudyView.jsx` | `Flashcards`, `Quiz`, `StudyHome` |
| 파일 불러오기 창 | `src/components/ImportDialog.jsx` | `importOnly`, `importAndClassify` |
| 설정 창 | `src/components/SettingsDialog.jsx` | `SettingsDialog` |
| 검색 (⌘K) | `src/components/SearchPalette.jsx` | `SearchPalette` |
| 토스트 알림 | `src/components/Toasts.jsx` + `AppContext.toast` | |
| 테마 전환 버튼 | `src/components/ThemeToggle.jsx`, `src/lib/useTheme.js` | |
| 메모 카드 / 목록 행 | `src/components/MemoCard.jsx` | `MemoCard`, `MemoRow` |
| 공통 UI (팝오버, 모달, 카테고리 점/뱃지) | `src/components/common.jsx` | `Popover`, `Modal`, `CategoryPill` |
| **Gemini 프롬프트 · 호출** | `src/lib/gemini.js` | 아래 4절 참고 |
| 저장소 (Firestore / 게스트 메모리) | `src/lib/store.js` | `createFirestoreStore`, `createMemoryStore` |
| 설정 기본값 · 라벨 | `src/lib/settings.js` | `DEFAULT_SETTINGS`, `SETTING_LABELS`, `FEATURE_LABELS` |
| 카테고리 색 · 이름 매칭 | `src/lib/categories.js` | `matchExistingCategory`, `pickColor` |
| txt/md 파싱 | `src/lib/importFile.js` | `parseImportFile` |
| md/zip 내보내기 | `src/lib/exportMd.js` | `memoToMarkdown`, `downloadMemosZip` |
| 사진 압축 | `src/lib/image.js` | `fileToCompressedDataUrl` |
| 해시 라우터 | `src/lib/router.js` | `useRoute`, `navigate`, `openImport` |
| Firebase 초기화 | `src/lib/firebase.js` | `auth`, `db` |
| 텍스트 유틸 (해시, 날짜, 제목) | `src/lib/text.js` | `hashText`, `plainToHtml`, `memoTitle` |
| 스타일 전체 | `src/styles.css` | 아래 7절 참고 |
| 배포 | `.github/workflows/deploy.yml` | `GEMINI_API_KEY` 주입 |
| Firestore 보안 규칙 | `firestore.rules` | |
| **크롬 확장** (팝업 · 사이드 패널 · 우클릭 저장) | `extension/`, `vite.ext.config.js` | 아래 9절 |

## 1. 라우트 (해시 기반, `src/App.jsx` → `Shell`)

| 해시 | 화면 | 뒤로(←) |
|---|---|---|
| `#/` | `HomeView` | 없음 (최상위) |
| `#/new?c=카테고리ID` | `NewMemo` → `#/m/{새ID}?new=1` 로 교체 이동 | |
| `#/m/{id}` | `MemoView` | 카테고리 또는 홈 |
| `#/c/{id}` · `#/c/none` | `CategoryView` (none = 미분류) | 홈 |
| `#/study` · `#/study/m/{id}` · `#/study/c/{id}` | `StudyView` | 홈 / 메모 / 카테고리 |
| `#/ask` · `#/todos` · `#/trash` | `AskView` · `TodoView` · `TrashView` | 홈 |

- 전역 이벤트: `dm:import`(불러오기 창 열기, `openImport`), `dm:nav`(모바일 메뉴 열기, `openNav`)
- `navigate(path, { replace: true })`는 `HashChangeEvent`를 직접 보내므로 `e.newURL`이 비어 있습니다 → `window.location.href`로 판단해야 합니다

## 2. 전역 상태 (`src/AppContext.jsx`, `useApp()`)

| 값 · 함수 | 설명 |
|---|---|
| `session`, `isGuest`, `store`, `onSignOut` | 로그인 정보, 저장소(Firestore / 메모리) |
| `memos` / `trashed` | 활성 메모 / 휴지통 메모 (`deletedAt`으로 구분) |
| `categories`, `loaded` | 카테고리 목록, 첫 로딩 완료 여부 |
| `settings`, `updateSettings` | 설정 (localStorage + Firestore `users/{uid}.settings`). 게스트는 `autoSave`가 항상 false |
| `busy[memoId]` | `'analyze'` · `'study'` 진행 중 표시 |
| `toast(msg, {tone, action})` | 알림 (`action: {label, href | onClick}`) |
| `runAnalysis(id, {text,title}, {force, categorize, silent})` | 요약 · 분류. 20자 미만이거나 같은 내용(sourceHash)이면 건너뜀 |
| `runStudy(id, {text}, {force})` | 학습 카드 (별도 호출). 같은 내용이면 건너뜀 |
| `ensureCategory(name)` | 이름으로 찾고, 없으면 생성 |
| `moveMemoToCategory` / `applySuggestedCategory` | 직접 이동(`categoryManual: true`) / AI 제안 적용 |
| `removeMemo` · `restoreMemo` · `togglePin` | 휴지통(설정 `useTrash`) 또는 즉시 삭제, 복원, 고정 |
| `quickCapture(text, {html, source, wait})` | 빠른 메모 저장 + 자동 분류 (`html`·`source`·`wait`는 확장에서 사용) |
| `MIN_AI_LENGTH` (= 20) | 이보다 짧으면 AI를 부르지 않음 |

## 3. 메모 편집 화면 (`src/editor/MemoView.jsx`)

- **로딩**: `ready` 전까지 기다렸다가 `editor.commands.setContent(memo.html)`로 한 번만 실음. 이후에는 에디터가 원본
- **저장 `save({status})`**: `snapshot()`(doc → html/text) → `store.saveMemo`. 새 메모는 첫 저장 때 URL에서 `?new=1`을 뗌. `MAX_HTML_BYTES` = 900KB
- **자동 저장**: `markDirty()` → 1.2초 디바운스. 탭을 숨기거나 화면을 떠날 때 저장. 수동 저장 모드에서는 화면을 떠날 때 확인 창
- **작성 완료 `complete()`**
  1. 제목과 본문이 모두 비어 있으면 저장 안 함
  2. 저장
  3. 20자 미만이면 `tooShort` 안내만 표시
  4. 20자 이상이면 `runAnalysis` 후 `runStudy`
- **패널**: `openPanel(id)` / `closePanel()`. 더보기 메뉴와 서식 바는 하나만 열림. 모바일에서는 `.panel-scrim`이 뒤 화면을 막음
- **도구 레일 `TOOLS`**: image, table, voice(설정 `voiceMemo`), spell, tidy, insight, study
- **삭제 `remove()`**: 먼저 화면을 옮기고, 삭제는 기다리지 않고 뒤에서 처리 (Firestore 쓰기는 서버 응답까지 기다리기 때문)
- **음성 → 본문 `insertVoiceText()`**: 본문 끝에 문단으로 추가 후 저장

## 4. Gemini (`src/lib/gemini.js`)

| 함수 | 용도 | 응답 |
|---|---|---|
| `requestText(body)` | 공통 fetch (`x-goog-api-key`) | text |
| `generateJson({system,user,schema})` | JSON 스키마 응답 (user는 최대 24000자) | object |
| `analyzeMemo({text, categories:[{name, examples}]})` | 제목 · 요약 · 핵심 · 태그 · `categoryDecision`(none/existing/new). 입력 6000자, 카테고리 힌트 50개 | `none`이면 `category: ''` |
| `spellCheck(text)` | 맞춤법 · 띄어쓰기. 앞 6000자만 | `{issues, truncated}` |
| `tidyMemo(html)` | 구조 다듬기. 사진은 `<img data-ref>`로 바꿔 보내고 복원, 16000자 초과면 거절 | `{html, note}` |
| `makeStudySet(text)` | 플래시카드 3~10개, 퀴즈 3~6개. 입력 8000자 | `{cards, quiz}` |
| `categoryOverview({name, memos})` | 요약 · 핵심 위주, 최대 60개 · 14000자 | `{html, gaps}` |
| `askNotes({question, memos, history})` | 메모 근거 답변 + 출처. 대화 2턴, 질문 500자 (메모 발췌는 `AskView.pickMemos`에서 1만 자 이하) | `{answer, sources:[memoId]}` |
| `transcribeAudio(blob, maxSec)` | 16kHz WAV로 변환 후 받아쓰기 (최대 5분) | text |

- 모델: `VITE_GEMINI_MODEL` (기본 `gemini-3.5-flash-lite`), 키: `VITE_GEMINI_API_KEY`
- 모든 프롬프트에 `GUARD` 문구 포함 (메모 내용을 지시로 해석하지 않도록 하는 방어)
- AI가 돌려준 HTML은 반드시 `sanitizeHtml` 또는 미리보기 에디터를 거친 뒤 저장 · 표시

## 5. 데이터 (`src/lib/store.js`)

```
users/{uid}                  settings
users/{uid}/categories/{id}  name, color, order, createdBy('ai'|'user'), overview{html,gaps,sourceHash,memoCount,createdAt}
users/{uid}/memos/{id}       title, html, text, categoryId, categoryManual, tags[], status('draft'|'done'),
                             pinned, deletedAt, source{name,kind}, aiError,
                             ai{title,summary,keyPoints,tags,category,isNewCategory,categoryReason,sourceHash,model,analyzedAt},
                             study{cards[{front,back}], quiz[{question,options[4],answer,explanation}], sourceHash, createdAt},
                             createdAt, updatedAt
```

- 저장소 인터페이스(두 구현 공통): `subscribeMemos`, `subscribeCategories`, `saveMemo(id, data, {isNew})`(merge), `patchMemo`(문서가 있을 때만, `undefined`이면 필드 삭제), `deleteMemo`, `createCategory`, `updateCategory`, `deleteCategory(id, memoIds)`, `loadSettings`, `saveSettings`, `newMemoId`
- `normalizeMemo`: 예전 앱 데이터(`content`, `folderId`)를 `html` · `text`로 변환
- 휴지통: `deletedAt`이 있으면 휴지통. 30일 지나면 접속할 때 영구 삭제(`AppProvider`의 정리 effect)

## 6. 설정 키 (`src/lib/settings.js`)

| 키 | 기본 | 영향 |
|---|---|---|
| `autoSave` | true | 자동 저장 (게스트는 강제로 false) |
| `autoAnalyze` | true | 작성 완료 시 요약 · 분류 |
| `autoCategorize` | true | 분류 자동 적용 (끄면 제안만) |
| `autoTitle` | true | 빈 제목 자동 채우기 |
| `autoStudy` | true | 작성 완료 시 학습 카드 |
| `quickCapture` · `voiceMemo` · `relatedMemos` · `askNotes` · `categoryOverview` · `todoView` · `useTrash` | true | 추가 기능 표시 여부 |
| `theme` | `'system'` | `'light'` / `'dark'` |

localStorage 키: `dm-settings`, `dm-view`(보드/목록), `dm-sb-open`(사이드바 펼친 카테고리), `dm-voice-mode`(실시간 인식이 막힌 기기면 `record`)

## 7. 스타일 지도 (`src/styles.css`)

| 구역 | 내용 |
|---|---|
| Tokens | 색 · 폰트 변수, 다크 모드(`prefers-color-scheme`, `[data-theme]`), 카테고리 색 `--c-*` |
| Base · Buttons | `.btn`, `.icon-btn`, `.btn-primary` |
| Login · Shell · Sidebar | `.sidebar`, `.sb-item`, `.sb-children`(트리) |
| Popover · Modal | `.popover`, `.modal` + `.modal-scroll`(스크롤 담당) |
| Pages · Board · List | `.page`, `.card-grid`, `.memo-card`, `.memo-row` |
| Memo editor | `.format-bar`, `.bubble`, `.props`, `.tool-rail`, `.side-panel`, `.panel-*` |
| 음성 메모 | `.voice-btn`, `.voice-live`, `.voice-actions` |
| Prose | 에디터 본문(`.prose`), 표 · 할 일 · 주석 · 구분선 굵기 |
| Study · Palette · Settings · Toasts | 플래시카드, 퀴즈, 검색, 설정 스위치 |
| 공통 상단 바 / 신규 기능 | `.pagebar`, `.quick`, `.related`, `.overview`, `.ask-*`, `.todo` |
| Responsive (≤860px) | 사이드바는 서랍, 도구 레일은 하단, 패널은 바텀 시트, `.panel-scrim` |
| `@media (hover: hover)` | **모든 `:hover` 규칙은 여기에** (터치 기기에서 두 번 눌러야 열리는 문제 방지) |

## 9. 크롬 확장 (`extension/`, 가이드는 [EXTENSION.md](EXTENSION.md))

| 찾는 것 | 파일 | 시작점 |
|---|---|---|
| 빌드 설정 · manifest 생성 · 모듈 바꿔 끼우기 | `vite.ext.config.js` | `manifest`, `resolve.alias` |
| 사이드 패널 진입점 (웹앱 `App` 전체) | `extension/src/sidepanel.jsx` | `RouteInbox` |
| 우클릭으로 담은 글 → 메모 저장 | `extension/src/ClipInbox.jsx` | `clipToMemo`, `drain` |
| 툴바 팝업 (빠른 메모) | `extension/src/popup.jsx`, `popup.css` | `QuickPopup`, `openPanel` |
| 확장 로그인 화면 | `extension/src/ExtLogin.jsx` | `describe` |
| chrome API 모음 | `extension/src/chromeApi.js` | `signInWithChromeGoogle`, `openSidePanel`, `takeClips` |
| 서비스 워커 (우클릭 메뉴) | `extension/public/background.js` | `collect`, `addClip` |
| 배포 zip (스토어용은 `key` 제거) | `scripts/zip-extension.mjs` | |
| 릴리스 워크플로 | `.github/workflows/extension.yml` | `ext-v*` 태그 |

- 빌드할 때 `firebase/auth` → `firebase/auth/web-extension`, `./components/Login` → `ExtLogin`으로 바뀝니다. 웹앱 코드에서 이 두 import 경로를 바꾸면 확장 빌드도 같이 확인하세요
- 웹앱 쪽 연결점: `App({ extras })`(AppProvider 안에 끼워 넣기), `quickCapture(text, { html, source, wait })`
- 저장소 키: `chrome.storage.local` `dm-clips`(우클릭 대기열, Web Lock `dm-clips`로 보호), `chrome.storage.session` `dm-open-route`(사이드 패널이 열 화면)
- 빌드 환경 변수: `EXT_OAUTH_CLIENT_ID`, `EXT_PUBLIC_KEY`(GitHub Variables), Gemini 키는 `GEMINI_API_KEY_EXT`가 있으면 우선 (확장 요청엔 Referer가 없어 리퍼러 제한 키는 막힘)
- 웹 글 메모의 `source`: `{ name: 페이지 제목, kind: 'web', url }`
