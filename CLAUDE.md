# CLAUDE.md

AI 메모 웹앱 **Dynamic Memo** (React + Tiptap + Firebase + Gemini, GitHub Pages 배포)에서 작업하는 세션을 위한 규칙입니다.
- 코드 위치: [PREF.md](PREF.md)
- 지금까지의 작업과 남은 일: [plans.md](plans.md)

## 사용자와 대화하는 방식
- **반말로 답한다.** 전체 흐름은 짧고 한눈에 보이게, 중요한 내용만 자세히 쓴다.
- 모르거나 결정이 애매하면 **추측하지 말고 먼저 질문한다.**
- 사용자는 주로 **모바일(아이폰 Safari)**에서 확인한다. 버그 제보도 대부분 모바일에서 온다.

## 앱 문구 · 제품 원칙
- 앱 안의 모든 문구(토스트, confirm, 안내)는 **존댓말**로 쓴다. 대화(반말)와 혼동하지 않는다.
- **모든 자동 기능은 기본값이 켜짐이고, 설정에서 끌 수 있으며, 결과는 직접 고칠 수 있어야 한다.** 새 기능이 번거로울 수 있으면 `src/lib/settings.js`의 `FEATURE_LABELS`에 켜기/끄기를 추가한다.
- AI 티가 나지 않는 차분한 디자인을 유지한다 (Notion · Obsidian 계열, 이모지와 그라데이션은 쓰지 않음).
- 학습 기능처럼 큰 AI 작업은 분석과 **별도 Gemini 호출**로 한다 (컨텍스트 절약).
- 본문이 20자 미만(`MIN_AI_LENGTH`)이면 Gemini를 부르지 않는다.
- my-memo-app의 *기능*만 참고한다. 디자인과 플랫폼은 가져오지 않는다.

## 자주 하는 요청 → 처리 순서
1. **"수정해 줘 / 기능 추가해 줘"**
   1. 구현한다.
   2. `npm run build`를 돌린다.
   3. Playwright로 **iPhone 13 에뮬레이션(터치)** 테스트를 한다.
   4. 커밋하고 푸시한다.
   5. "PR 만들어서 병합할까?"라고 묻는다.
2. **"PR 만들고 병합해 줘"**
   1. `mcp__github__create_pull_request`로 PR을 만든다.
   2. `mcp__github__merge_pull_request`로 병합한다. 이때 `expectedHeadSha`는 40자 SHA로 넣는다.
   3. 배포 사이트의 번들 해시가 바뀔 때까지 기다려서 배포를 확인한다.
3. **"이 서비스 URL"** → https://oceanstarlight.github.io/Dynamic-memo-AKADM/
4. **기능 추천 요청** → 비슷한 서비스(Mem, Notion, Obsidian, NotebookLM 등)를 웹에서 검색하고, 표로 추천한 뒤 사용자에게 고르게 한다.

## Git · 배포 규칙
- 작업 브랜치: `claude/dazzling-wozniak-14jhkp`. 원격: `oceanstarlight/Dynamic-memo-AKADM`
- PR이 병합된 뒤에는 브랜치를 최신 main에서 다시 시작한다.

```bash
git fetch origin main && git checkout -B claude/dazzling-wozniak-14jhkp origin/main
```

- **강제 푸시(`--force*`)는 쓰지 않는다** (권한에서 거부됨). 병합된 main 위에 커밋을 쌓으면 일반 푸시로 충분하다.
- 커밋 메시지는 한국어로, 변경 이유가 드러나게 쓴다.
- 배포: `main`에 푸시 → `.github/workflows/deploy.yml` → GitHub Pages. 키는 Secret `GEMINI_API_KEY`를 빌드할 때 주입한다.

## 개발 환경
- Node.js 22, npm, Vite 8, React 19, Tiptap 3, Firebase 12
- 로컬 키: `.env.local`에 `VITE_GEMINI_API_KEY` (예시는 `.env.example`)

| 용도 | 명령 |
|---|---|
| 개발 서버 | `npm run dev` |
| 빌드 | `npm run build` |
| 빌드 미리보기 | `npm run preview` |

- 테스트용 빌드: `VITE_GEMINI_API_KEY=test-key npm run build` (키가 없으면 AI 패널에 경고가 뜸)
- Firebase 프로젝트: `my-memo-app-bc3c5` (웹 config는 공개값이라 `src/lib/firebase.js`에 있음)

## 테스트 방법 (Playwright, 미리 설치된 Chromium)
- `require('playwright')`를 그대로 쓴다. 다시 설치하지 않는다. WebKit은 없으므로 실제 Safari 동작은 사용자에게 확인을 부탁한다.
- **게스트 로그인**으로 테스트한다. Firebase 로그인은 자동화할 수 없다.
- Gemini는 `page.route('**/generativelanguage.googleapis.com/**')`로 가짜 응답을 넣는다. 시스템 프롬프트 문구로 구분하는데, **겹치는 단어 주의**: 개요 프롬프트에도 "knowledge base"가 들어 있으므로 분석은 `'organize a personal knowledge base'`로 구분한다.
- 모바일: `devices['iPhone 13']`과 `page.tap`. 스크롤은 CDP `Input.dispatchTouchEvent`(touchStart/Move/End)로 확인한다. `synthesizeScrollGesture`는 이 환경에서 동작하지 않는다.
- 음성: `window.SpeechRecognition`과 `webkitSpeechRecognition`을 **둘 다** 가짜로 바꾼다 (크롬에는 접두어 없는 버전이 있음). 녹음 fallback은 `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`.
- 미리보기 서버 끄기: `kill $(pgrep -f "port 417[5]")`처럼 괄호 트릭을 쓴다. `pkill -f "vite preview"`는 자기 셸까지 죽인다(exit 144).

## 이미 겪은 함정 (다시 만들지 말 것)
- **Firestore 쓰기 `await`는 서버 응답까지 기다린다** → 화면 이동(삭제 등)은 기다리지 말고 먼저 한다.
- **`:hover` 스타일은 `@media (hover: hover)` 안에만 둔다.** 터치 기기에서 첫 탭이 hover로 먹혀 두 번 눌러야 열린다.
- **`.modal`에 `overflow`를 다시 넣지 않는다.** 스크롤은 `.modal-scroll`이 맡는다. 같은 규칙에 `overflow: hidden`이 `overflow-y: auto`를 덮어써서 모바일에서 스크롤이 안 됐다.
- `navigate(..., {replace:true})`가 보내는 hashchange에는 `newURL`이 없다 → `window.location.href`로 판단한다.
- Tiptap 읽기 전용 에디터는 화면에 붙기 전에 `setContent`가 반영되지 않는다 → 정제는 `sanitizeHtml`(임시 에디터), 표시는 정제된 HTML로 한다.
- BubbleMenu를 여러 개 쓸 때는 `pluginKey`를 다르게 준다.
- 카테고리 분류는 `categoryDecision`(none/existing/new)을 유지한다. 억지 분류를 막기 위한 장치다.
- 사진은 Storage 없이 압축 data URL로 저장한다 (문서 900KB 제한).

## 문서 유지
기능을 추가하거나 구조를 바꾸면 같은 커밋에서 [plans.md](plans.md)(작업 기록)와 [PREF.md](PREF.md)(색인)도 함께 고친다. README는 사용자에게 보이는 기능이 바뀔 때 한국어(`README.md`)와 영어(`README.en.md`)를 같이 고친다.
