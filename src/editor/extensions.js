import { Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import HorizontalRule from '@tiptap/extension-horizontal-rule';

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

export function buildExtensions({ placeholder = "내용을 입력하거나 '/'로 블록을 추가하세요" } = {}) {
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
