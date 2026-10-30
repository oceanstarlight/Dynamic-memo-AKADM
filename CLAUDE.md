# CLAUDE.md

AI 메모 웹앱 **Dynamic Memo** (React + Tiptap + Firebase + Gemini, GitHub Pages 배포).
코드 위치는 [PREF.md](PREF.md), 작업 기록은 [plans.md](plans.md)를 본다.

## 대화 방식
- **반말로 답한다.** 전체 흐름은 짧고 한눈에 보이게, 중요한 내용만 자세히 쓴다.
- 모르거나 결정이 애매하면 **추측하지 말고 먼저 질문한다.**

## 제품 원칙
- 앱 안의 모든 문구(토스트, confirm, 안내)는 **존댓말**로 쓴다.
- **모든 자동 기능은 기본값이 켜짐**이어야 한다. 동시에 설정에서 끌 수 있어야 하고, 결과는 직접 고칠 수 있어야 한다. 번거로울 수 있는 새 기능은 `src/lib/settings.js`의 `FEATURE_LABELS`에 켜기/끄기를 추가한다.
- 차분한 디자인을 유지한다 (Notion · Obsidian 계열, AI 티 나지 않게).
- 큰 AI 작업(예: 학습 카드)은 분석과 **별도 Gemini 호출**로 한다. 본문이 20자 미만이면 Gemini를 부르지 않는다.

## 개발 환경
- Node.js 22, npm. 개발 서버는 `npm run dev`, 빌드는 `npm run build`
- 크롬 확장은 `npm run build:ext`(→ `dist-extension/`), zip은 `npm run zip:ext`. 자세한 내용은 [EXTENSION.md](EXTENSION.md)
- 로컬 키: `.env.local`의 `VITE_GEMINI_API_KEY`. 배포에서는 GitHub Secret `GEMINI_API_KEY`가 빌드할 때 주입된다.
- 테스트: Playwright(미리 설치된 Chromium)를 쓴다. 게스트 로그인과 `devices['iPhone 13']`으로 확인하고, Gemini 응답은 `page.route`로 가짜 응답을 넣는다.

## 문서 유지
기능이나 구조를 바꾸면 [plans.md](plans.md)와 [PREF.md](PREF.md)도 함께 고친다. 사용자에게 보이는 기능이 바뀌면 `README.md`(한국어)와 `README.en.md`(영어)도 같이 고친다.
