<div align="center">

# Dynamic Memo

**Just write. AI files, summarizes, and turns your notes into flashcards.**

[![Deploy](https://github.com/oceanstarlight/Dynamic-memo-AKADM/actions/workflows/deploy.yml/badge.svg)](https://github.com/oceanstarlight/Dynamic-memo-AKADM/actions/workflows/deploy.yml)
![React](https://img.shields.io/badge/React-19-149eca)
![Vite](https://img.shields.io/badge/Vite-8-646cff)
![Tiptap](https://img.shields.io/badge/Tiptap-3-1a1a1a)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%C2%B7%20Firestore-ffca28)
![Gemini](https://img.shields.io/badge/Gemini-3.5%20Flash--Lite-4285f4)

[한국어](README.md) · **English**

[**▶ Open the app**](https://oceanstarlight.github.io/Dynamic-memo-AKADM/)

</div>

> The app UI is in Korean.

---

## Contents
- [About](#about)
- [Highlights](#highlights)
- [All features](#all-features)
- [How to use](#how-to-use)
- [Getting started](#getting-started)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Tech stack](#tech-stack)
- [Related docs](#related-docs)

## About

Write a note and press **작성 완료 (Done)**. Gemini reads it and then:
- files it into the right **category**: it reuses an existing one when it fits, creates a new one when nothing fits, and leaves the note uncategorized when there is no real content;
- adds a **summary, key points, tags and a title**;
- builds **flashcards and a quiz** for review.

Every automation is on by default, and **each one can be turned off in Settings or edited by hand.**

## Highlights

| | Feature | What it does |
|---|---|---|
| ✍️ | **Comfortable editor** | Notion-style `/` blocks, Markdown shortcuts (`#`, `-`, `>`, `**`, `==`), tables, images, highlights, annotations |
| 🗂️ | **AI categorization** | Prefers your existing categories, creates new ones only when needed, leaves empty notes uncategorized |
| 📝 | **Summary & tags** | A 2–3 sentence summary, key points and tags. The summary is editable |
| 🎓 | **Study cards** | Flashcards and multiple-choice quizzes per note, with review by category |
| 🎙️ | **Voice memo** | Live speech-to-text that appends to the note |
| 💬 | **Ask your notes** | Answers using only your notes and links the source notes |

## All features

<details>
<summary><b>Writing</b></summary>

- Slash menu: headings, lists, to-dos, quotes, code, dividers (thin/normal/thick), tables, images
- Formatting: bold, italic, underline, strike, highlight, text color, annotations, links. Select text or use the `T` button
- Tap an image or a table to open a delete / add-row / add-column menu
- Autosave after 1.2 seconds of inactivity, or save manually with `Ctrl/⌘ + S`. Edits made offline are kept on the device and uploaded when the connection returns
- Quick capture: type in the box on Home and press Enter
- Import `.txt` / `.md` files (UTF-8 or EUC-KR)
</details>

<details>
<summary><b>AI tools (right side of the note; bottom on mobile)</b></summary>

- Summary & category, spell check, tidy-up (preview, then apply or undo), study cards, voice memo
- Notes under 20 characters skip the AI call and show a "too short to summarize" message
</details>

<details>
<summary><b>Organizing & finding</b></summary>

- Board and list views by category, tag filters, `Ctrl/⌘ + K` search
- Sidebar tree: tap a category to expand its notes
- Related notes (no AI call)
- Category overview: one study-guide page that covers every note in a category
- To-do view: checkboxes from every note in one list
- Pin, trash (kept for 30 days), Markdown and zip export
</details>

<details>
<summary><b>Account & display</b></summary>

- Google or GitHub sign-in, or a guest mode that keeps notes in the current tab only and has no autosave
- Light/dark toggle (follows the system by default)
- Mobile-friendly layout
</details>

## How to use

1. **Sign in** with Google or GitHub, or try it as a guest.
2. **Write**: press **새 메모 (New note)**. Type `/` to insert blocks.
3. **Finish**: press **작성 완료 (Done)**. The summary and category appear in the side panel, and you can change either one.
4. **Browse**: Home groups your notes by category. The sidebar expands categories so you can open notes directly.
5. **Review**: open **학습 (Study)** for flashcards and quizzes.
6. **Settings** (account menu): turn each automation and extra feature on or off.

| Shortcut | Action |
|---|---|
| `/` | Block menu |
| `Ctrl/⌘ + K` | Search |
| `Ctrl/⌘ + S` | Save |
| `Space` · `←` · `→` | Flip card · don't know · know |

## Getting started

**Requirements**: Node.js 22 and npm.

```bash
git clone https://github.com/oceanstarlight/Dynamic-memo-AKADM.git
```

```bash
cd Dynamic-memo-AKADM && npm install
```

```bash
cp .env.example .env.local
```

Put your key in `VITE_GEMINI_API_KEY` in `.env.local`, then start the dev server:

```bash
npm run dev
```

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (`dist/`) |
| `npm run preview` | Preview the build |

## Deployment

Pushing to `main` triggers GitHub Actions, which builds the app and deploys it to GitHub Pages. The setup below only needs to be done once.

1. **Gemini key**: in the repo, go to Settings → Secrets and variables → Actions and add `GEMINI_API_KEY`.
2. **Pages**: go to Settings → Pages and set Source to **GitHub Actions**.
3. **Firebase console**:
   - Enable the Google and GitHub sign-in providers. GitHub needs an OAuth App Client ID and Secret.
   - Add `oceanstarlight.github.io` to the authorized domains.
   - Publish [`firestore.rules`](firestore.rules).
4. **Protect the key**: this is a static site, so the key ships in the bundle. Restrict it in the Google Cloud console with an **HTTP referrer restriction** (`https://oceanstarlight.github.io/*`).

## Project structure

```
src/
├─ App.jsx              # auth gate, routing, global shortcuts
├─ AppContext.jsx       # global state, AI runs (analysis/study), trash, quick capture
├─ components/          # pages (home, category, study, ask, to-do, trash) and shared UI
├─ editor/              # note page, Tiptap extensions, menus, AI and voice panels
└─ lib/                 # Firebase, Gemini, stores, router, settings, import/export
```

For a function-level index, see [PREF.md](PREF.md) (written in Korean).

## Data model

```
users/{uid}                  settings
users/{uid}/categories/{id}  name, color, order, createdBy, overview{html, gaps, sourceHash}
users/{uid}/memos/{id}       title, html, text, categoryId, categoryManual, tags, status,
                             pinned, deletedAt, ai{summary, keyPoints, category, ...},
                             study{cards[], quiz[]}, createdAt, updatedAt
```

## Tech stack

| Area | Used |
|---|---|
| UI | React 19, Vite 8, lucide-react, Pretendard |
| Editor | Tiptap 3 (StarterKit, Table, Image, Highlight, TextStyle, TaskList) |
| Backend | Firebase Auth and Firestore (offline cache) |
| AI | Gemini `gemini-3.5-flash-lite` (JSON-schema responses) |
| Voice | Web Speech API, with a MediaRecorder + Gemini fallback |
| Misc | marked (md→HTML), turndown (HTML→md), fflate (zip) |
| Deploy | GitHub Actions → GitHub Pages |

## Related docs
- [plans.md](plans.md): work log and roadmap (Korean)
- [PREF.md](PREF.md): code and feature index (Korean)
- [CLAUDE.md](CLAUDE.md): rules and environment for AI coding sessions

<sub>Rebuilt from the features of [my-memo-app](https://github.com/oceanstarlight/my-memo-app). No license has been chosen yet.</sub>
