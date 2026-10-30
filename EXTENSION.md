# Dynamic Memo 크롬 확장 — 만들기부터 관리까지

> 웹앱 코드(`src/`)를 그대로 써서 만든 크롬 확장(Manifest V3)입니다.
> 코드 위치는 [PREF.md](PREF.md) 9절, 작업 기록은 [plans.md](plans.md) 8절을 보세요.

## 한눈에 보기

```
[1 로컬 빌드·설치] → [2 웹 스토어 항목 만들기 (ID 확정)] → [3 Google 로그인 설정] → [4 Gemini 키]
        → [5 릴리스 (태그 푸시)] → [6 웹 스토어 제출·심사] → [7 사용자 설치] → [8 업데이트·관리]
```

| 기능 | 어디서 | 설명 |
|---|---|---|
| 빠른 메모 | 툴바 아이콘 팝업 (`Alt+Shift+M`) | 적고 Enter → 저장 + AI 자동 분류 |
| 웹 글 저장 | 글 선택 → 우클릭 → *선택한 글을 Dynamic Memo에 저장* | 페이지 제목 · 링크를 출처로 함께 저장 |
| 페이지 저장 | 빈 곳 우클릭 → *이 페이지를 Dynamic Memo에 저장* | 제목 + 링크만 저장 |
| 전체 앱 | 사이드 패널 | 웹앱과 같은 화면 (편집기, 검색, 학습, 질문…) |

```
extension/
├─ sidepanel.html · src/sidepanel.jsx   웹앱 App 전체 + ClipInbox(우클릭 대기열 처리)
├─ popup.html · src/popup.jsx           빠른 메모 팝업
├─ src/ExtLogin.jsx                     확장용 로그인 (chrome.identity → Firebase)
├─ src/chromeApi.js                     로그인 · 사이드 패널 열기 · 대기열
└─ public/background.js · icons/        서비스 워커(우클릭 메뉴), 아이콘
vite.ext.config.js                      확장 빌드 + manifest.json 생성
scripts/zip-extension.mjs               배포용 zip 2개 생성
.github/workflows/extension.yml         태그 푸시 → zip → GitHub Release
```

**동작 원리**
- 우클릭 저장: 서비스 워커가 글을 `chrome.storage.local`의 대기열(`dm-clips`)에 넣고 사이드 패널을 엽니다 → 사이드 패널이 꺼내서 저장 · 분류합니다. 로그인 전이면 로그인한 뒤 저장됩니다.
- 로그인: 확장에서는 `signInWithPopup`을 쓸 수 없어서(MV3는 원격 스크립트 금지) `chrome.identity.getAuthToken`으로 받은 Google 토큰을 `signInWithCredential`에 넘깁니다. 웹앱과 **같은 Firebase 계정 · 같은 메모**입니다.
- 빌드 때 `firebase/auth` → `firebase/auth/web-extension`, `Login` → `ExtLogin`으로 바꿔 끼웁니다. 웹앱 코드는 그대로입니다.

---

## 1. 로컬 빌드 · 설치 (개발자 모드)

```bash
npm ci
npm run build:ext      # → dist-extension/
npm run dev:ext        # 파일을 고치면 자동으로 다시 빌드 (확장 새로고침은 직접)
npm run zip:ext        # → release/*.zip
```

1. Chrome에서 `chrome://extensions` 열기
2. 오른쪽 위 **개발자 모드** 켜기
3. **압축해제된 확장 프로그램 로드** → `dist-extension` 폴더 선택
4. 코드를 고친 뒤에는 카드의 🔄(새로고침) 버튼. 사이드 패널 · 팝업도 다시 열어야 반영됩니다

> 처음에는 Google 로그인이 안 되고 **게스트만** 됩니다. 2~3단계를 마치면 로그인됩니다.

## 2. 웹 스토어 항목 만들기 (확장 ID 확정)

Google 로그인 설정에 **확장 ID**가 필요하고, ID는 웹 스토어가 정합니다. 그래서 스토어 항목부터 만듭니다.

1. [Chrome 웹 스토어 개발자 대시보드](https://chrome.google.com/webstore/devconsole) 접속 → 개발자 등록 (**1회 $5**)
2. **새 항목** → `npm run zip:ext`로 만든 `release/dynamic-memo-ext-<버전>-store.zip` 업로드 (아직 제출하지 않고 초안으로 둡니다)
3. 항목 화면에서 **항목 ID**(32자, 예: `abcdefghijklmnopabcdefghijklmnop`) 복사
4. **패키지** 탭 → **공개 키 보기** → `-----BEGIN PUBLIC KEY-----` 사이의 한 줄 문자열 복사 → 이것이 `EXT_PUBLIC_KEY`

`EXT_PUBLIC_KEY`를 넣고 빌드하면 로컬(개발자 모드)에서도 스토어와 **같은 ID**가 되어 로그인을 테스트할 수 있습니다.
스토어용 zip에서는 `key`를 자동으로 뺍니다 (스토어가 직접 관리).

## 3. Google 로그인 설정

**① OAuth 클라이언트 만들기** — [Google Cloud 콘솔](https://console.cloud.google.com/apis/credentials?project=my-memo-app-bc3c5) (Firebase와 같은 프로젝트 `my-memo-app-bc3c5`)
1. **사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
2. 애플리케이션 유형: **Chrome 확장 프로그램**
3. 항목 ID: 2단계의 확장 ID
4. 만들어진 클라이언트 ID(`….apps.googleusercontent.com`) → 이것이 `EXT_OAUTH_CLIENT_ID`

**② Firebase 승인 도메인** — Firebase 콘솔 → Authentication → 설정 → 승인된 도메인 → `chrome-extension://<확장 ID>` 추가

**③ 값 넣기**
- 로컬: `.env.local`
  ```
  EXT_OAUTH_CLIENT_ID=xxxx.apps.googleusercontent.com
  EXT_PUBLIC_KEY=MIIBIjANBgkqh...
  ```
- GitHub: **Settings → Secrets and variables → Actions → Variables** 탭에 같은 이름으로 등록 (공개값이라 Secret이 아니라 Variable)

> 로그인은 **Chrome에 로그인된 Google 계정**으로 됩니다. 웹에서 GitHub로 가입한 계정은 확장에서 쓸 수 없습니다 (웹앱을 이용).

## 4. Gemini API 키

기본은 **웹과 같은 키**(GitHub Secret `GEMINI_API_KEY`)를 빌드 때 넣습니다. 단, 주의할 점이 하나 있습니다.

- 확장에서 보내는 요청에는 **Referer 헤더가 없습니다** (테스트로 확인). 그래서 키에 *HTTP 리퍼러 제한*을 걸어 두었다면 확장에서는 `API_KEY_HTTP_REFERRER_BLOCKED`로 막힙니다.
- 이때는 확장 전용 키를 하나 더 만듭니다.
  1. [Google AI Studio](https://aistudio.google.com/apikey) 또는 Cloud 콘솔에서 새 키 생성
  2. 애플리케이션 제한: 없음 / **API 제한: Generative Language API만**
  3. Cloud 콘솔 → 할당량에서 하루 요청 수 한도를 낮게 설정 (키가 확장 파일 안에 들어가서 누구나 꺼낼 수 있기 때문)
  4. GitHub Secret **`GEMINI_API_KEY_EXT`** 로 등록 → 워크플로가 이 키를 우선 사용합니다
- 로컬에서는 `.env.local`의 `VITE_GEMINI_API_KEY`를 그대로 씁니다.

## 5. 릴리스 (자동 빌드)

```bash
# 1) package.json 의 version 올리기 (예: 0.1.0 → 0.2.0). 확장 버전도 이 값이 됩니다
npm version minor --no-git-tag-version
git commit -am "확장 0.2.0"
# 2) 태그 푸시 (태그와 version이 다르면 워크플로가 실패합니다)
git tag ext-v0.2.0 && git push origin main ext-v0.2.0
```

→ GitHub Actions **Build Chrome Extension**이 돌고, **Releases**에 zip 2개가 올라갑니다.

| 파일 | 용도 |
|---|---|
| `dynamic-memo-ext-<버전>-store.zip` | 웹 스토어 업로드 |
| `dynamic-memo-ext-<버전>.zip` | 압축 풀어서 개발자 모드로 설치 (스토어와 같은 ID) |

## 6. 웹 스토어 제출 · 심사

대시보드의 항목에서 아래를 채우고 **검토를 위해 제출**합니다. 심사는 보통 며칠 걸립니다.

**스토어 등록정보**
- 설명, 카테고리(생산성), 언어(한국어)
- 아이콘 128×128: `extension/public/icons/icon-128.png`
- 스크린샷 1280×800 또는 640×400 최소 1장 (사이드 패널 · 팝업 화면)

**개인정보 보호 탭**
- 단일 목적: "메모를 작성하고 웹에서 선택한 글을 메모로 저장해 AI로 분류 · 요약합니다."
- 권한 사유

| 권한 | 사유 |
|---|---|
| `identity` | Google 계정으로 로그인해 사용자의 메모를 불러오기 위해 |
| `contextMenus` | 우클릭 메뉴로 선택한 글을 메모로 저장하기 위해 |
| `sidePanel` | 사이드 패널에서 메모 앱을 보여 주기 위해 |
| `storage` | 우클릭으로 담은 글을 사이드 패널로 전달하기 위해 |
| `activeTab` · `scripting` | 우클릭한 탭에서 선택한 글을 줄바꿈 그대로 읽기 위해 (사용자가 메뉴를 누를 때만) |

- 원격 코드 사용: **아니요** (모든 코드가 패키지 안에 있음)
- 데이터 사용: 개인 식별 정보(이메일), 웹사이트 콘텐츠(사용자가 선택한 글) 수집에 체크 → 판매 · 무관한 용도 사용 없음
- 개인정보처리방침 URL: `https://github.com/oceanstarlight/Dynamic-memo-AKADM/blob/main/PRIVACY.md`

**공개 범위**: 공개 / 비공개(링크가 있는 사람만) / 그룹 공개 중 선택. 혼자 · 지인만 쓰면 *비공개*가 편합니다.

## 7. 설치 (사용자)

| 방법 | 순서 | 업데이트 |
|---|---|---|
| **웹 스토어** (권장) | 스토어 페이지 → *Chrome에 추가* | 자동 |
| **zip** | Releases에서 `dynamic-memo-ext-<버전>.zip` 받기 → 압축 풀기 → `chrome://extensions` → 개발자 모드 → *압축해제된 확장 프로그램 로드* | 직접 (새 zip으로 교체 후 🔄) |

설치 후: 툴바의 퍼즐 아이콘 → Dynamic Memo **고정** → 아이콘 클릭 → *사이드 패널에서 로그인*.

## 8. 업데이트 · 관리

| 할 일 | 방법 |
|---|---|
| 새 버전 배포 | 5단계(버전 올리기 → 태그) → 대시보드 **패키지 → 새 패키지 업로드** → 제출. 사용자는 몇 시간 안에 자동 업데이트 |
| 단축키 바꾸기 | `chrome://extensions/shortcuts` |
| 오류 보기 | `chrome://extensions` → 카드의 **오류** / *서비스 워커* 링크(백그라운드 콘솔). 사이드 패널은 패널 안에서 우클릭 → 검사 |
| 사용 통계 · 리뷰 | 개발자 대시보드 → 분석 / 평점 |
| 잘못된 버전 되돌리기 | 이전 태그의 zip을 **버전 숫자만 올려서** 다시 업로드 (스토어는 낮은 버전 업로드를 거절) |
| 키 교체 | Gemini 키가 새면: 키 삭제 → 새 키를 Secret에 등록 → 새 버전 릴리스 |
| 배포 중단 | 대시보드 → 항목 → *게시 취소* |

## 알려진 제약

- **GitHub 로그인 미지원** (선택에 따라 Google만). 게스트도 가능하지만 사이드 패널을 닫으면 사라집니다.
- 팝업은 바깥을 누르면 닫힙니다. AI 정리 중에 닫으면 **메모는 저장되지만 분류는 빠질 수 있습니다** → 사이드 패널에서 메모를 열고 *요약 · 분류*를 누르면 됩니다.
- 사이드 패널에서는 마이크 권한 창이 뜨지 않을 수 있습니다. 음성 메모가 안 되면 웹앱을 이용해 주세요.
- 확장 화면 크기가 좁아서 사이드 패널은 웹앱의 모바일 레이아웃으로 보입니다.
