import { Editor } from '@tiptap/core';
import { marked } from 'marked';
import { buildPreviewExtensions } from '../editor/extensions';
import { plainToHtml } from './text';

const MAX_BYTES = 800 * 1024; // Firestore 문서 한도를 고려
export const IMPORT_ACCEPT = '.txt,.md,.markdown,text/plain,text/markdown';

function detectKind(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'md' || ext === 'markdown' || file.type === 'text/markdown') return 'markdown';
  if (ext === 'txt' || file.type === 'text/plain') return 'text';
  return null;
}

// 대부분 UTF-8이지만, 윈도우 메모장에서 만든 한글 파일(EUC-KR/CP949)도 읽을 수 있게
function decode(buffer) {
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(buffer), encoding: 'UTF-8' };
  } catch {
    return { text: new TextDecoder('euc-kr').decode(buffer), encoding: 'EUC-KR' };
  }
}

function splitMarkdown(raw, fallbackTitle) {
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''); // front matter 제거
  const heading = /^\s*#\s+(.+?)\s*#*\s*$/m.exec(body);
  // 문서 맨 앞의 # 제목은 메모 제목으로 쓴다
  if (heading && body.slice(0, heading.index).trim() === '') {
    return { title: heading[1].trim(), body: body.slice(heading.index + heading[0].length) };
  }
  return { title: fallbackTitle, body };
}

export async function parseImportFile(file) {
  const kind = detectKind(file);
  if (!kind) throw new Error('txt, md 파일만 불러올 수 있어요.');
  if (file.size > MAX_BYTES) throw new Error('파일이 너무 커요 (최대 800KB).');

  const { text: raw, encoding } = decode(await file.arrayBuffer());
  const clean = raw.replace(/^﻿/, '');
  if (!clean.trim()) throw new Error('빈 파일이에요.');

  const fallbackTitle = file.name.replace(/\.[^.]+$/, '').slice(0, 60);
  let title = fallbackTitle;
  let html;
  if (kind === 'markdown') {
    const split = splitMarkdown(clean, fallbackTitle);
    title = split.title.slice(0, 60);
    html = marked.parse(split.body, { gfm: true, breaks: true, async: false });
  } else {
    html = plainToHtml(clean.replace(/\r\n/g, '\n'));
  }

  // 에디터 스키마로 한 번 걸러서 저장한다 (지원하지 않는 태그·스크립트 제거, 본문 텍스트 추출)
  const editor = new Editor({ extensions: buildPreviewExtensions(), content: html });
  const { doc } = editor.state;
  const result = {
    kind,
    encoding,
    name: file.name,
    title,
    html: editor.getHTML(),
    text: doc.textBetween(0, doc.content.size, '\n', ' '),
  };
  editor.destroy();
  return result;
}
