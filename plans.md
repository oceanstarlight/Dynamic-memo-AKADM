# Plans — Dynamic Memo 작업 기록

> 쓰기만 하면 AI가 카테고리 분류 · 요약 · 학습 카드까지 정리해 주는 메모 웹앱.
> 배포: https://oceanstarlight.github.io/Dynamic-memo-AKADM/
> 이 문서는 **지금까지 한 일 / 결정한 것 / 남은 일**을 한눈에 보기 위한 기록입니다. 코드 위치는 [PREF.md](PREF.md), 작업 규칙은 [CLAUDE.md](CLAUDE.md)를 참고하세요.

## 한눈에 보기

```
[1] 기반 ─▶ [2] 편의 ─▶ [3] 분류 정확도 ─▶ [4] 확장 6종 ─▶ [5] 안정화 ─▶ [6] 음성 메모 ─▶ [7] 비용 보호 ─▶ [8] 크롬 확장
   #1         #2          #3                 #4              #5            #6              #7             (브랜치)
```

| 단계 | PR | 핵심 내용 | 상태 |
|---|---|---|---|
| 1 | [#1](https://github.com/oceanstarlight/Dynamic-memo-AKADM/pull/1) | my-memo-app 기능 이식, React + Tiptap 앱, Firebase · Gemini 연동, GitHub Pages 배포 | ✅ 병합 |
| 2 | [#2](https://github.com/oceanstarlight/Dynamic-memo-AKADM/pull/2) | 요약 패널 하단 버튼, 라이트/다크 전환, txt · md 불러오기, 기존 카테고리 재사용 강화 | ✅ 병합 |
| 3 | [#3](https://github.com/oceanstarlight/Dynamic-memo-AKADM/pull/3) | 요약 패널 X 복구, 내용 없는 메모는 미분류(`categoryDecision: none`) | ✅ 병합 |
| 4 | [#4](https://github.com/oceanstarlight/Dynamic-memo-AKADM/pull/4) | 빠른 메모 · 관련 메모 · 질문하기 · 카테고리 개요 · 할 일 · 휴지통/고정/내보내기, 공통 상단 바, 사이드바 트리 | ✅ 병합 |
| 5 | [#5](https://github.com/oceanstarlight/Dynamic-memo-AKADM/pull/5) | 존댓말 통일, 표 · 사진 삭제 메뉴, 짧은 메모 요약 생략, 창 겹침 · 삭제 버그 | ✅ 병합 |
| 6 | [#6](https://github.com/oceanstarlight/Dynamic-memo-AKADM/pull/6) | 음성 메모(실시간 받아쓰기), 모바일 설정창 스크롤 수정, 문서(plans/README/PREF/CLAUDE) | ✅ 병합 |
| 7 | [#7](https://github.com/oceanstarlight/Dynamic-memo-AKADM/pull/7) | 홈 카테고리→태그 필터, 사이드바 순서, 아이폰 음성 fallback, **AI 입력 크기 보호** | ✅ 병합 |
| 8 | (브랜치) | **크롬 확장**: 빠른 메모 팝업, 우클릭 웹 글 저장, 사이드 패널 전체 앱, 릴리스 워크플로 | ⏳ |

---

## 1. 기반 구축 (PR #1)

**목표**: my-memo-app의 *기능만* 가져와 새 레포에서 새 디자인으로 다시 만들기.

- 스택 결정: **React 19 + Vite 8 + Tiptap v3**, Firebase 12(Auth · Firestore), Gemini `gemini-3.5-flash-lite`
- 로그인: Google · GitHub · 게스트(탭 메모리만, 자동 저장 없음)
- 에디터: `/` 슬래시 메뉴, 마크다운 단축 입력, 선택 시 서식 메뉴, `T` 서식 바
  - 서식: 제목/부제목, 하이라이트 · 글자색, 주석, 구분선 굵기, 표, 사진
- 사이드 도구: 사진, 표, 맞춤법 검사, AI 정리, 요약 · 분류, 학습 카드
- 자동 저장(1.2초 디바운스) + Firestore 오프라인 캐시
- 작성 완료 → Gemini 분석(요약 · 핵심 · 태그 · 제목 · 카테고리) + 학습 카드(별도 호출)
- 카테고리 보드/목록, ⌘K 검색, 플래시카드 · 퀴즈
- **모든 자동 기능은 설정에서 끌 수 있고 기본값은 켜짐**
- 배포: GitHub Actions → Pages, `GEMINI_API_KEY` Secret을 빌드 때 주입

**결정 사항**
| 항목 | 선택 | 이유 |
|---|---|---|
| 키 관리 | GH Pages + 빌드 주입 | 가장 단순 · 무료. 키가 번들에 노출되므로 Google Cloud에서 HTTP 리퍼러 제한 필수 |
| 사진 저장 | 압축 data URL을 메모 문서에 저장 | Firebase Storage는 Blaze 요금제 필요. 장당 약 250KB, 문서 900KB 제한 |
| 학습 기능 | 분석과 **별도 Gemini 호출** | 컨텍스트가 커지지 않게 (사용자 요청) |
| 게스트 | 브라우저 메모리만 | 사용자 선택 |

## 2. 편의 기능 (PR #2)
- 요약 패널 하단 '홈으로 돌아가기' / '새 메모 작성'
- 라이트/다크 전환 버튼 (기본은 시스템 설정)
- txt · md 불러오기: UTF-8/EUC-KR 판별, 마크다운 → HTML, '내 메모로 불러오기' / 'AI 자동 분류'
- 카테고리 분류 시 카테고리별 예시 메모 제목을 함께 보내고, 비슷한 이름은 기존 카테고리로 합침

## 3. 분류 정확도 (PR #3)
- 문제: 의미 없는 글("요약, 요약 불가, 요약")까지 기존 카테고리에 억지로 넣음
- 해결: 응답 스키마에 `categoryDecision`(`none` / `existing` / `new`) 추가 → `none`이면 미분류
- 요약 패널: X 버튼 + 하단 버튼 두 개 함께

## 4. 확장 기능 6종 (PR #4)
웹 조사(Mem, Reflect, Tana, NotebookLM, Obsidian, RemNote)를 바탕으로 추천하고 사용자가 고른 기능입니다. 간격 반복 복습은 제외했습니다.

| 기능 | 참고 서비스 | AI 호출 |
|---|---|---|
| 빠른 메모 | Mem | 작성 완료와 동일 |
| 관련 메모 | Mem Related Notes, Obsidian 백링크 | 없음 |
| 메모에게 질문 | Mem Chat, NotebookLM | 질문당 1회 |
| 카테고리 개요 | NotebookLM | 버튼을 누를 때 1회 |
| 할 일 모아보기 | Notion, Obsidian Tasks | 없음 |
| 휴지통 · 고정 · md/zip 내보내기 | Notion, Obsidian | 없음 |

- 공통 상단 바 `PageBar`: [☰(모바일)] [← 상위 화면] [경로] ··· [동작]
- 사이드바 트리: 카테고리를 누르면 메모 목록이 펼쳐짐. 선택 표시는 회색 배경 대신 굵은 글씨
- 모바일에서 두 번 눌러야 열리던 문제 → `:hover`를 `@media (hover: hover)` 안으로 옮김

## 5. 안정화 (PR #5)
- 앱 안의 모든 안내 문구를 **존댓말**로 통일
- 사진 · 표 삭제 메뉴(`BlockBubble`) — 모바일에서는 키보드로 지울 수 없어서
- 본문이 20자 미만이면 Gemini를 부르지 않고 "내용이 없거나 너무 짧아서 요약할 수 없습니다" 표시. 제목과 본문이 모두 비어 있으면 저장하지 않음
- 패널 · 서식 바 · 더보기 메뉴는 한 번에 하나만 열림. 모바일 패널 뒤에 scrim
- 삭제가 안 눌린 것처럼 보이던 문제: Firestore 서버 응답을 기다리지 않고 바로 화면 이동

## 6. 음성 메모 · 설정창 (PR #6)
- 음성 메모: Web Speech API로 실시간 받아쓰기
  - 종료 후 '메모에 텍스트 저장' / '이어서 녹음하기' / '처음부터 녹음하기'
  - 실시간 인식을 지원하지 않는 브라우저는 MediaRecorder로 녹음한 뒤 Gemini로 받아쓰기
- 설정창 스크롤 안 됨: `.modal` 규칙에서 `overflow: hidden`이 `overflow-y: auto`를 덮어쓰고 있었음 → 안쪽에 스크롤 전용 영역을 두고, 창이 떠 있는 동안 뒤 화면 스크롤 잠금

## 7. 비용 보호 · 화면 정리 (PR #7)
- 홈 상단: 태그가 너무 많던 문제 → **카테고리 줄 → (고르면) 그 카테고리의 태그 줄**
- 사이드바 순서: 검색 › 새 메모 › 모든 메모 › 메모에게 질문 › 할 일 › 학습 › 파일 불러오기
- 아이폰 Safari가 실시간 받아쓰기를 막으면(`service-not-allowed`) 자동으로 '녹음 → AI 받아쓰기'로 전환하고 기억. 녹음은 16kHz WAV로 변환, 최대 5분
- **AI 입력 크기 보호** (검토 결과 반영. 호출 횟수 한도 · 출력 길이 제한 · 작성 완료 재호출 생략은 사용자 결정으로 넣지 않음)

| 위험 | 보완 |
|---|---|
| 긴 메모(수천~수만 자)를 통째로 전송 | 기능별 입력 예산: 분석 6천 · 학습 8천 · 맞춤법 6천(초과분은 안내) · 정리 1.6만(서식 포함, 초과 시 거절) |
| AI 정리에 사진 data URL(수백 KB)까지 전송 | 사진은 자리표시자로 바꿔 보내고 결과에서 복원 |
| 카테고리 · 예시 제목이 늘수록 분석 프롬프트 증가 | 카테고리 힌트 최대 50개, 예시 2개 · 20자 |
| 카테고리 개요가 본문 40개×1800자 전송 | 요약 · 핵심 위주, 최대 60개 · 1.4만 자 |
| 질문하기가 메모 8개×2500자 + 대화 4턴 | 요약 + 질문 단어 주변 발췌, 메모당 1500 · 합계 1만 자, 대화 2턴 |

## 8. 크롬 확장 (현재 브랜치)
가이드: [EXTENSION.md](EXTENSION.md)

- 기능(사용자 선택): 툴바 팝업 빠른 메모, 우클릭 '선택한 글 / 이 페이지' 저장(출처 링크 포함), 사이드 패널에서 웹앱 전체
- 웹앱 코드를 그대로 쓰고, 빌드 때 `firebase/auth` → `web-extension`, `Login` → `ExtLogin`만 바꿔 끼움
- 우클릭 저장은 서비스 워커 → `chrome.storage` 대기열 → 사이드 패널이 저장 · 분류 (AI 로직을 한 곳에서만 돌리기 위해)

**결정 사항**
| 항목 | 선택 | 이유 |
|---|---|---|
| 로그인 | Google만 (`chrome.identity` → `signInWithCredential`) | MV3에서는 팝업 로그인 불가. GitHub은 OAuth 앱 추가 설정이 필요해 제외 (사용자 선택) |
| Gemini 키 | 웹과 같은 Secret, `GEMINI_API_KEY_EXT`가 있으면 우선 | 사용자 요청. 확장 요청엔 Referer가 없어서 리퍼러 제한 키는 막힘 → 그때만 전용 키 |
| 배포 | 태그 `ext-v*` → GitHub Release zip, 웹 스토어는 직접 업로드 | 사용자 선택 (스토어 자동 업로드는 제외) |
| 확장 ID | 스토어가 정한 ID + `key`로 로컬도 같은 ID | OAuth 클라이언트가 ID에 묶여 있음 |

---

## Gemini 호출 정리

| 언제 | 함수 | 횟수 |
|---|---|---|
| 작성 완료 · 빠른 메모 (본문 20자 이상) | `analyzeMemo` + `makeStudySet` | 2회 (학습 카드를 끄면 1회) |
| 맞춤법 검사 / AI 정리 버튼 | `spellCheck` / `tidyMemo` | 각 1회 |
| 메모에게 질문 | `askNotes` | 질문당 1회 |
| 카테고리 개요 버튼 | `categoryOverview` | 1회 |
| 음성 메모 (실시간 인식 미지원 브라우저 · 아이폰 fallback) | `transcribeAudio` | 녹음당 1회 (최대 5분) |

## 남은 일 · 아이디어

- [ ] 8단계 브랜치 PR · 병합
- [ ] 확장: 웹 스토어 항목 생성 → OAuth 클라이언트 · Firebase 승인 도메인 · GitHub Variables 설정 → 실제 로그인 확인 (EXTENSION.md 2~3단계)
- [ ] 확장: Gemini 키에 리퍼러 제한이 있는지 확인, 있으면 `GEMINI_API_KEY_EXT` 등록
- [ ] 확장: 사이드 패널 음성 메모(마이크 권한) 실제 확인
- [ ] (제안) DB 비용: 메모 목록 구독이 본문 · 사진까지 전부 받음 → 본문을 별도 문서로 분리하고 목록은 가벼운 필드만 (데이터 이전 필요, 결정 대기)
- [ ] 실제 기기 확인: 아이폰 Safari 설정창 스크롤, 음성 인식 품질, 사진 탭 삭제 메뉴
- [ ] 실제 Gemini 응답 품질 확인 (질문 답변, 카테고리 개요, `none` 판단)
- [ ] my-memo-app 코드에 노출된 예전 Gemini 키 폐기 · 교체 여부 확인
- [ ] (보류) 간격 반복 복습 — 사용자가 이번 범위에서 제외
- [ ] (비추천) 그래프 뷰, `[[메모 링크]]` — 만드는 비용에 비해 실제 활용이 적음
- [ ] 번들 크기(약 1.5MB) — 필요하면 화면 단위로 코드 분할
