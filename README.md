# Dynamic Memo

메모를 쓰고 **작성 완료**를 누르면 Gemini가 요약·핵심·태그를 만들고 카테고리(필요하면 새로 생성)에 배치해 주는 메모 앱.
[my-memo-app](https://github.com/oceanstarlight/my-memo-app)의 기능(Firebase 연동, 로컬 → 클라우드 동기화, Gemini 분석)을 가져와 React로 새로 만들었다.

## 기능
| 구분 | 내용 |
| --- | --- |
| 로그인 | Google · GitHub · 게스트 (게스트는 탭 메모리에만 저장, 자동 저장 없음) |
| 에디터 | Tiptap 기반. `/` 블록 메뉴, 마크다운 단축 입력(`#`, `-`, `>`, `**`, `==` …), 선택 시 서식 메뉴, `T` 버튼으로 서식 바 |
| 서식 | 제목/부제목, 굵게·기울임·밑줄·취소선, 하이라이트·글자색, 주석, 링크, 목록·할 일, 인용, 코드, 구분선 굵기(얇게/보통/굵게), 표, 사진 |
| 사이드 도구 | 사진 추가, 표 추가, 맞춤법 검사, AI 정리(구조 다듬기·미리보기·되돌리기), 요약·분류, 학습 카드 |
| 자동 저장 | 입력을 멈추고 1.2초 뒤 Firestore에 저장 (오프라인 캐시 사용), `Ctrl/⌘+S` 수동 저장 |
| AI 분류 | 기존 카테고리 우선, 맞는 게 없으면 새 카테고리 생성. 카테고리·요약·태그 모두 직접 수정 가능 |
| 학습 | 분석과 **별도 호출**로 플래시카드 + 객관식 퀴즈 생성, 메모/카테고리 단위로 복습 |
| 보기 | 카테고리별 보드 / 목록, 태그 필터, `Ctrl/⌘+K` 검색 |

| 빠른 메모 | 홈 맨 위 입력창에 적고 Enter → 저장 · 자동 분류 |
| 관련 메모 | 메모 아래에 태그·카테고리가 겹치는 메모 추천 (AI 호출 없음) |
| 메모에게 질문 | 관련 메모만 골라 Gemini가 출처와 함께 답함 |
| 카테고리 개요 | 카테고리 안 메모들을 한 장으로 정리 (누를 때만 호출) |
| 할 일 | 여러 메모의 체크박스를 모아 보고 바로 체크 |
| 휴지통 · 고정 · 내보내기 | 30일 보관 후 삭제, 맨 위 고정, md / zip 내보내기 |

모든 자동 기능(자동 저장, 완료 시 AI 정리, 카테고리 자동 배치, 제목 자동 생성, 학습 카드 자동 생성)은 **설정**에서 끌 수 있고 기본값은 켜짐. 추가 기능(빠른 메모, 관련 메모, 질문, 개요, 할 일, 휴지통)도 설정에서 각각 끌 수 있다.

## 배포 설정 (한 번만)
1. **Gemini 키**: GitHub 저장소 → Settings → Secrets and variables → Actions → `GEMINI_API_KEY` 추가
2. **Pages**: Settings → Pages → Source를 **GitHub Actions**로 변경. `main`에 푸시하면 자동 배포
3. **Firebase 콘솔** (`my-memo-app-bc3c5`)
   - Authentication → 로그인 방법 → **GitHub** 사용 설정 (GitHub OAuth App의 Client ID/Secret 필요, 콜백 URL은 콘솔에 표시된 값)
   - Authentication → 설정 → 승인된 도메인에 `oceanstarlight.github.io` 추가
   - Firestore 규칙에 `firestore.rules` 내용 적용
4. **키 노출 대비**: 정적 사이트라 키가 번들에 포함된다. Google Cloud 콘솔에서 해당 API 키에 **HTTP 리퍼러 제한**(`https://oceanstarlight.github.io/*`)과 Generative Language API 전용 제한을 꼭 걸 것

## 로컬 개발
```bash
npm install
cp .env.example .env.local   # VITE_GEMINI_API_KEY 입력
npm run dev
```

## 데이터 구조 (Firestore)
```
users/{uid}                 settings
users/{uid}/categories/{id} name, color, order, createdBy('ai'|'user')
users/{uid}/memos/{id}      title, html, text, categoryId, categoryManual, tags, status('draft'|'done'),
                            ai{summary, keyPoints, category, categoryReason, isNewCategory, sourceHash, model},
                            study{cards[], quiz[], sourceHash}, createdAt, updatedAt
```
이전 앱의 메모(`content` 텍스트)도 그대로 읽힌다 (미분류로 표시).
