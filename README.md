<div align="center">

# Dynamic Memo

**쓰기만 하세요. 분류 · 요약 · 복습 카드는 AI가 정리합니다.**

[![Deploy](https://github.com/oceanstarlight/Dynamic-memo-AKADM/actions/workflows/deploy.yml/badge.svg)](https://github.com/oceanstarlight/Dynamic-memo-AKADM/actions/workflows/deploy.yml)
![React](https://img.shields.io/badge/React-19-149eca)
![Vite](https://img.shields.io/badge/Vite-8-646cff)
![Tiptap](https://img.shields.io/badge/Tiptap-3-1a1a1a)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%C2%B7%20Firestore-ffca28)
![Gemini](https://img.shields.io/badge/Gemini-3.5%20Flash--Lite-4285f4)

**한국어** · [English](README.en.md)

[**▶ 바로 사용하기**](https://oceanstarlight.github.io/Dynamic-memo-AKADM/)

</div>

---

## 목차
- [소개](#소개)
- [핵심 기능](#핵심-기능)
- [전체 기능](#전체-기능)
- [사용법](#사용법)
- [시작하기 (개발)](#시작하기-개발)
- [배포 설정](#배포-설정)
- [프로젝트 구조](#프로젝트-구조)
- [데이터 구조](#데이터-구조)
- [기술 스택](#기술-스택)
- [관련 문서](#관련-문서)

## 소개

메모를 쓰고 **작성 완료**를 누르면 Gemini가 내용을 읽고 다음을 처리합니다.
- 알맞은 **카테고리**에 넣습니다. 맞는 카테고리가 없으면 새로 만들고, 내용이 거의 없으면 미분류로 둡니다.
- **요약 · 핵심 · 태그 · 제목**을 붙입니다.
- 복습용 **플래시카드와 퀴즈**를 만듭니다.

자동 기능은 기본으로 켜져 있고, **모두 설정에서 끄거나 결과를 직접 고칠 수 있습니다.**

## 핵심 기능

| | 기능 | 설명 |
|---|---|---|
| ✍️ | **편한 에디터** | 노션처럼 `/`로 블록 추가, 마크다운 단축 입력(`#`, `-`, `>`, `**`, `==`), 표 · 사진 · 하이라이트 · 주석 |
| 🗂️ | **AI 자동 분류** | 기존 카테고리를 우선 사용하고, 필요할 때만 새로 만듭니다. 내용이 없는 메모는 미분류로 둡니다 |
| 📝 | **요약 · 태그** | 2~3문장 요약과 핵심, 태그. 요약은 직접 고칠 수 있습니다 |
| 🎓 | **학습 카드** | 메모마다 플래시카드 · 객관식 퀴즈를 만들고 카테고리 단위로 복습합니다 |
| 🎙️ | **음성 메모** | 말하면 실시간으로 글자로 받아써서 본문에 붙입니다 |
| 💬 | **메모에게 질문** | 내 메모만 근거로 답하고 출처 메모를 링크합니다 |

## 전체 기능

<details>
<summary><b>작성</b></summary>

- 슬래시 메뉴(`/`): 제목 · 부제목 · 목록 · 할 일 · 인용 · 코드 · 구분선(얇게/보통/굵게) · 표 · 사진
- 서식: 굵게 · 기울임 · 밑줄 · 취소선 · 하이라이트 · 글자색 · 주석 · 링크 (글자를 선택하거나 `T` 버튼)
- 사진 · 표를 누르면 삭제, 행/열 추가 · 삭제 메뉴가 뜹니다
- 자동 저장: 입력을 멈추고 1.2초 뒤 저장되고, `Ctrl/⌘ + S`로 직접 저장할 수도 있습니다. 오프라인일 때는 기기에 보관했다가 연결되면 올립니다
- 빠른 메모: 홈 맨 위 입력창에 쓰고 Enter를 누르면 저장 · 분류됩니다
- 파일 불러오기: `.txt` · `.md` (UTF-8 / EUC-KR)
</details>

<details>
<summary><b>AI 도구 (메모 화면 오른쪽 · 모바일은 아래)</b></summary>

- 요약 · 분류 / 맞춤법 검사 / AI 정리(구조 다듬기, 미리보기 후 적용 · 되돌리기) / 학습 카드 / 음성 메모
- 본문이 20자 미만이면 AI를 부르지 않고 "내용이 없거나 너무 짧아서 요약할 수 없습니다"를 표시합니다
</details>

<details>
<summary><b>정리 · 찾기</b></summary>

- 카테고리별 보드 / 목록 보기, 태그 필터, `Ctrl/⌘ + K` 검색
- 사이드바: 카테고리를 누르면 메모 목록이 펼쳐집니다
- 관련 메모 추천 (AI 호출 없음)
- 카테고리 개요 노트: 카테고리 안 메모들을 한 장으로 정리
- 할 일 모아보기: 여러 메모에 흩어진 체크박스를 한 화면에서 확인
- 고정 · 휴지통(30일 보관) · md / zip 내보내기
</details>

<details>
<summary><b>계정 · 화면</b></summary>

- Google · GitHub 로그인, 게스트 모드(이 탭에만 저장, 자동 저장 없음)
- 라이트 / 다크 전환 (기본은 시스템 설정)
- 모바일 화면 대응
</details>

## 사용법

```
로그인 ─▶ 새 메모 ─▶ 작성 (/ 메뉴 · 음성 메모 · 사진 · 표) ─▶ [작성 완료]
                                                              │
                     ┌────────────────────────────────────────┤
                     ▼                                        ▼
           요약 · 태그 · 카테고리 배치                 학습 카드 · 퀴즈 생성
                     │                                        │
                     ▼                                        ▼
          홈 / 카테고리에서 모아보기 · 질문하기             학습 메뉴에서 복습
```

1. **로그인**: Google 또는 GitHub로 로그인합니다. 둘러보기만 할 때는 게스트로 들어갑니다.
2. **작성**: 사이드바나 홈의 **새 메모**를 누릅니다. `/`를 입력하면 블록 메뉴가 열립니다.
3. **완료**: **작성 완료**를 누르면 오른쪽 패널에 요약과 카테고리가 나타납니다. 카테고리와 요약은 직접 바꿀 수 있습니다.
4. **둘러보기**: 홈에서는 카테고리별로 보고, 사이드바에서는 카테고리를 펼쳐 메모를 바로 엽니다.
5. **복습**: **학습** 메뉴에서 플래시카드와 퀴즈를 풉니다.
6. **설정**: 사이드바 계정 메뉴 → 설정에서 자동 기능과 추가 기능을 하나씩 켜고 끕니다.

| 단축키 | 동작 |
|---|---|
| `/` | 블록 메뉴 |
| `Ctrl/⌘ + K` | 검색 |
| `Ctrl/⌘ + S` | 저장 |
| `Space` · `←` · `→` | 플래시카드 뒤집기 · 모름 · 알아요 |

## 시작하기 (개발)

**필요 환경**: Node.js 22, npm

```bash
git clone https://github.com/oceanstarlight/Dynamic-memo-AKADM.git
```

```bash
cd Dynamic-memo-AKADM && npm install
```

```bash
cp .env.example .env.local
```

`.env.local`의 `VITE_GEMINI_API_KEY`에 키를 넣은 뒤 개발 서버를 실행합니다.

```bash
npm run dev
```

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |

## 배포 설정

`main`에 푸시하면 GitHub Actions가 빌드해서 GitHub Pages로 배포합니다. 처음에 한 번만 설정하면 됩니다.

1. **Gemini 키**: 레포 Settings → Secrets and variables → Actions → `GEMINI_API_KEY`
2. **Pages**: Settings → Pages → Source를 **GitHub Actions**로 설정
3. **Firebase 콘솔** (`my-memo-app-bc3c5`)
   - Authentication → 로그인 방법: Google, GitHub 사용 설정 (GitHub는 OAuth App의 Client ID/Secret 필요)
   - Authentication → 설정 → 승인된 도메인: `oceanstarlight.github.io`
   - Firestore → 규칙: [`firestore.rules`](firestore.rules) 내용 게시
4. **키 보호**: 정적 사이트라서 키가 번들에 포함됩니다. Google Cloud 콘솔에서 해당 키에 **HTTP 리퍼러 제한**(`https://oceanstarlight.github.io/*`)을 걸어 주세요.

## 프로젝트 구조

```
src/
├─ App.jsx              # 로그인 분기, 라우팅, 전역 단축키
├─ AppContext.jsx       # 전역 상태 · AI 실행(분석/학습) · 휴지통 · 빠른 메모
├─ components/          # 화면(홈 · 카테고리 · 학습 · 질문 · 할 일 · 휴지통)과 공통 UI
├─ editor/              # 메모 화면, Tiptap 확장, 서식 · 슬래시 메뉴, AI · 음성 패널
└─ lib/                 # Firebase · Gemini · 저장소 · 라우터 · 설정 · 불러오기/내보내기
```

파일별 함수 색인은 [PREF.md](PREF.md)에 있습니다.

## 데이터 구조

```
users/{uid}                  settings
users/{uid}/categories/{id}  name, color, order, createdBy, overview{html, gaps, sourceHash}
users/{uid}/memos/{id}       title, html, text, categoryId, categoryManual, tags, status,
                             pinned, deletedAt, ai{summary, keyPoints, category, ...},
                             study{cards[], quiz[]}, createdAt, updatedAt
```

예전 앱(my-memo-app)의 메모(`content` 텍스트)도 그대로 읽힙니다.

## 기술 스택

| 영역 | 사용 |
|---|---|
| UI | React 19, Vite 8, lucide-react, Pretendard |
| 에디터 | Tiptap 3 (StarterKit, Table, Image, Highlight, TextStyle, TaskList) |
| 백엔드 | Firebase Auth · Firestore (오프라인 캐시) |
| AI | Gemini `gemini-3.5-flash-lite` (JSON 스키마 응답) |
| 음성 | Web Speech API, 미지원 브라우저는 MediaRecorder + Gemini |
| 기타 | marked(md→HTML), turndown(HTML→md), fflate(zip) |
| 배포 | GitHub Actions → GitHub Pages |

## 관련 문서
- [plans.md](plans.md): 작업 기록과 남은 일
- [PREF.md](PREF.md): 코드 · 기능 색인
- [CLAUDE.md](CLAUDE.md): AI 작업 세션용 핵심 규칙

<sub>이 프로젝트는 [my-memo-app](https://github.com/oceanstarlight/my-memo-app)의 기능을 바탕으로 새로 만들었습니다. 아직 라이선스는 정하지 않았습니다.</sub>
