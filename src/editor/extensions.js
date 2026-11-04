import { Editor, Extension, Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { INDENT, SOFT_INDENT, leadingSpaces } from '../lib/indent';

// 주석: 선택한 글자에 짧은 설명을 달아 두는 마크 (점선 밑줄 + 마우스를 올리면 표시)
export const Annotation = Mark.create({
  name: 'annotation',
  inclusive: false,
  addAttributes() {
    return {
      note: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-note') || '',
        renderHTML: (attrs) => ({ 'data-note': attrs.note, title: attrs.note }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-note]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'annotation' }), 0];
  },
  addCommands() {
    return {
      setAnnotation: (note) => ({ commands }) => commands.setMark(this.name, { note }),
      unsetAnnotation: () => ({ commands }) => commands.unsetMark(this.name, { extendEmptyMarkRange: true }),
    };
  },
});

// 구분선 굵기: thin | normal | thick
const WeightedRule = HorizontalRule.extend({
  addAttributes() {
    return {
      weight: {
        default: 'normal',
        parseHTML: (el) => el.getAttribute('data-weight') || 'normal',
        renderHTML: (attrs) => ({ 'data-weight': attrs.weight }),
      },
    };
  },
});

// 선택 범위가 걸친 줄의 시작 위치들. 코드 블록은 줄바꿈마다, 나머지 블록은 블록 맨 앞이 한 줄이다
function selectedLineStarts(state) {
  const { from, to } = state.selection;
  const starts = [];
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isTextblock) return true;
    const base = pos + 1;
    if (node.type.name !== 'codeBlock') { starts.push({ pos: base, indent: SOFT_INDENT }); return false; }
    const text = node.textContent;
    let lineAt = 0;
    text.split('\n').forEach((line) => {
      const start = base + lineAt;
      const end = start + line.length;
      if (start <= to && end >= from) starts.push({ pos: start, indent: INDENT });
      lineAt += line.length + 1;
    });
    return false;
  });
  return starts;
}

// Tab = 공백 4칸, Shift+Tab = 내어쓰기. 목록 안에서는 기존처럼 목록 단계를 옮긴다 (isEnabled로 설정에서 끔)
const TabIndent = Extension.create({
  name: 'tabIndent',
  priority: 50,
  addOptions() {
    return { isEnabled: () => true };
  },
  addKeyboardShortcuts() {
    const inList = () => this.editor.isActive('listItem') || this.editor.isActive('taskItem');
    return {
      Tab: () => {
        if (!this.options.isEnabled() || inList()) return false;
        const { state, view } = this.editor;
        const { from, to, empty } = state.selection;
        const starts = selectedLineStarts(state);
        if (empty || starts.length <= 1) {
          const indent = state.selection.$from.parent.type.name === 'codeBlock' ? INDENT : SOFT_INDENT;
          view.dispatch(state.tr.insertText(indent, from, to).scrollIntoView());
          return true;
        }
        const tr = state.tr;
        starts.slice().reverse().forEach(({ pos, indent }) => tr.insertText(indent, pos));
        view.dispatch(tr.scrollIntoView());
        return true;
      },
      'Shift-Tab': () => {
        if (!this.options.isEnabled() || inList()) return false;
        const { state, view } = this.editor;
        const tr = state.tr;
        selectedLineStarts(state).reverse().forEach(({ pos }) => {
          const n = leadingSpaces(state.doc.textBetween(pos, Math.min(pos + INDENT.length, state.doc.content.size), '\n', '\n'));
          if (n) tr.delete(pos, pos + n);
        });
        if (tr.docChanged) view.dispatch(tr.scrollIntoView());
        return true;
      },
    };
  },
});

export function buildExtensions({ placeholder = "내용을 입력하거나 '/'로 블록을 추가하세요", tabIndent = () => true } = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      horizontalRule: false,
      link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
    }),
    WeightedRule,
    Highlight.configure({ multicolor: true }),
    TextStyleKit.configure({ fontFamily: false, lineHeight: false }),
    Image.configure({ allowBase64: true, inline: false }),
    TableKit.configure({ table: { resizable: true } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Annotation,
    TabIndent.configure({ isEnabled: tabIndent }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') return `제목 ${node.attrs.level}`;
        return placeholder;
      },
    }),
  ];
}

// 미리보기 전용 (AI 정리 결과 확인용) — 스키마가 허용하지 않는 태그/속성은 걸러진다
export function buildPreviewExtensions() {
  return buildExtensions({ placeholder: '' }).filter((ext) => ext.name !== 'placeholder');
}

// 문서 안에서 텍스트를 찾아 바꾼다 (맞춤법 교정 적용용). 한 텍스트 노드 안에 있는 첫 번째 일치만.
export function replaceTextInDoc(editor, original, corrected) {
  let target = null;
  editor.state.doc.descendants((node, pos) => {
    if (target || !node.isText) return !target;
    const index = node.text.indexOf(original);
    if (index >= 0) target = { from: pos + index, to: pos + index + original.length };
    return !target;
  });
  if (!target) return false;
  // insertText는 원래 글자의 서식(굵게·하이라이트 등)을 유지한다
  editor.view.dispatch(editor.state.tr.insertText(corrected, target.from, target.to));
  return true;
}

// 화면에 붙이지 않은 임시 에디터로 HTML을 스키마에 맞게 정제한다 (AI 결과 저장 전 · 스크립트 제거)
export function sanitizeHtml(html) {
  const editor = new Editor({ extensions: buildPreviewExtensions(), content: html });
  const clean = editor.getHTML();
  editor.destroy();
  return clean;
}
