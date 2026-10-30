import { useEffect, useRef, useState } from 'react';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  Bold, Italic, Underline, Strikethrough, Code, Highlighter, Baseline, MessageSquareText, Link2,
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Quote, Minus, Type, Eraser, Trash2,
} from 'lucide-react';
import { BLOCKS, HIGHLIGHTS, TEXT_COLORS, filterBlocks } from './blocks';
import { Popover } from '../components/common';

function useMarks(editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      highlight: e.isActive('highlight'),
      annotation: e.isActive('annotation'),
      link: e.isActive('link'),
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      ul: e.isActive('bulletList'),
      ol: e.isActive('orderedList'),
      todo: e.isActive('taskList'),
      quote: e.isActive('blockquote'),
    }),
  });
}

function ToolButton({ on, label, onClick, children }) {
  return (
    <button
      type="button" className={`tool${on ? ' on' : ''}`} title={label} aria-label={label} aria-pressed={!!on}
      onMouseDown={(e) => e.preventDefault()} onClick={onClick}
    >
      {children}
    </button>
  );
}

function ColorMenu({ editor }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="rel">
      <ToolButton label="하이라이트 · 글자색" on={open} onClick={() => setOpen((v) => !v)}><Highlighter size={15} /></ToolButton>
      <Popover open={open} onClose={() => setOpen(false)} className="swatch-pop">
        <div className="swatch-label">하이라이트</div>
        <div className="swatch-row">
          {HIGHLIGHTS.map((h) => (
            <button key={h.name} className="swatch" title={h.name} style={{ background: h.color }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { editor.chain().focus().toggleHighlight({ color: h.color }).run(); setOpen(false); }} />
          ))}
        </div>
        <div className="swatch-label">글자색</div>
        <div className="swatch-row">
          {TEXT_COLORS.map((c) => (
            <button key={c.name} className="swatch swatch-text" title={c.name} style={{ color: c.color }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { editor.chain().focus().setColor(c.color).run(); setOpen(false); }}>A</button>
          ))}
        </div>
        <button className="menu-item" onMouseDown={(e) => e.preventDefault()}
          onClick={() => { editor.chain().focus().unsetHighlight().unsetColor().run(); setOpen(false); }}>
          <Eraser size={14} /> 색 지우기
        </button>
      </Popover>
    </span>
  );
}

function annotate(editor) {
  if (editor.isActive('annotation')) {
    const current = editor.getAttributes('annotation').note || '';
    const next = prompt('주석 수정 (비우면 삭제)', current);
    if (next === null) return;
    if (!next.trim()) editor.chain().focus().extendMarkRange('annotation').unsetAnnotation().run();
    else editor.chain().focus().extendMarkRange('annotation').setAnnotation(next.trim()).run();
    return;
  }
  if (editor.state.selection.empty) { alert('주석을 달 글자를 먼저 선택해 주세요.'); return; }
  const note = prompt('주석 내용');
  if (note && note.trim()) editor.chain().focus().setAnnotation(note.trim()).run();
}

function setLink(editor) {
  const prev = editor.getAttributes('link').href || '';
  const url = prompt('링크 주소', prev || 'https://');
  if (url === null) return;
  if (!url.trim() || url.trim() === 'https://') editor.chain().focus().extendMarkRange('link').unsetLink().run();
  else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
}

function InlineTools({ editor, s }) {
  const chain = () => editor.chain().focus();
  return (
    <>
      <ToolButton label="굵게 (Ctrl+B)" on={s.bold} onClick={() => chain().toggleBold().run()}><Bold size={15} /></ToolButton>
      <ToolButton label="기울임 (Ctrl+I)" on={s.italic} onClick={() => chain().toggleItalic().run()}><Italic size={15} /></ToolButton>
      <ToolButton label="밑줄 (Ctrl+U)" on={s.underline} onClick={() => chain().toggleUnderline().run()}><Underline size={15} /></ToolButton>
      <ToolButton label="취소선" on={s.strike} onClick={() => chain().toggleStrike().run()}><Strikethrough size={15} /></ToolButton>
      <ToolButton label="인라인 코드" on={s.code} onClick={() => chain().toggleCode().run()}><Code size={15} /></ToolButton>
      <ColorMenu editor={editor} />
      <ToolButton label="주석" on={s.annotation} onClick={() => annotate(editor)}><MessageSquareText size={15} /></ToolButton>
      <ToolButton label="링크" on={s.link} onClick={() => setLink(editor)}><Link2 size={15} /></ToolButton>
    </>
  );
}

// 선택 영역 위에 뜨는 작은 서식 메뉴
export function SelectionBubble({ editor }) {
  const s = useMarks(editor);
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="textBubble"
      options={{ placement: 'top', offset: 8 }}
      shouldShow={({ editor: e, state }) => !state.selection.empty && !e.isActive('image') && !e.isActive('codeBlock') && e.isEditable}
      className="bubble"
    >
      <InlineTools editor={editor} s={s} />
    </BubbleMenu>
  );
}

// 'Aa' 버튼으로 펼치는 작은 서식 바
export function FormatBar({ editor }) {
  const s = useMarks(editor);
  const chain = () => editor.chain().focus();
  const [hrOpen, setHrOpen] = useState(false);
  return (
    <div className="format-bar" role="toolbar" aria-label="서식">
      <ToolButton label="텍스트" onClick={() => chain().setParagraph().run()}><Type size={15} /></ToolButton>
      <ToolButton label="제목" on={s.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}><Heading1 size={15} /></ToolButton>
      <ToolButton label="부제목" on={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 size={15} /></ToolButton>
      <ToolButton label="작은 제목" on={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}><Heading3 size={15} /></ToolButton>
      <span className="tool-sep" />
      <InlineTools editor={editor} s={s} />
      <span className="tool-sep" />
      <ToolButton label="글머리 목록" on={s.ul} onClick={() => chain().toggleBulletList().run()}><List size={15} /></ToolButton>
      <ToolButton label="번호 목록" on={s.ol} onClick={() => chain().toggleOrderedList().run()}><ListOrdered size={15} /></ToolButton>
      <ToolButton label="할 일 목록" on={s.todo} onClick={() => chain().toggleTaskList().run()}><ListChecks size={15} /></ToolButton>
      <ToolButton label="인용" on={s.quote} onClick={() => chain().toggleBlockquote().run()}><Quote size={15} /></ToolButton>
      <span className="rel">
        <ToolButton label="구분선 (굵기 선택)" on={hrOpen} onClick={() => setHrOpen((v) => !v)}><Minus size={15} /></ToolButton>
        <Popover open={hrOpen} onClose={() => setHrOpen(false)} className="hr-pop">
          {BLOCKS.filter((b) => b.id.startsWith('hr')).map((b) => (
            <button key={b.id} className="menu-item" onMouseDown={(e) => e.preventDefault()}
              onClick={() => { b.run(chain()).run(); setHrOpen(false); }}>
              <span className={`hr-sample hr-sample-${b.id}`} /> {b.label.replace('구분선 · ', '')}
            </button>
          ))}
        </Popover>
      </span>
    </div>
  );
}

// '/' 입력 시 뜨는 블록 메뉴
export function useSlashMenu(editor, onPickImage) {
  const [menu, setMenu] = useState(null); // { query, from, to, top, left, index }
  const menuRef = useRef(null);
  menuRef.current = menu;

  useEffect(() => {
    if (!editor) return undefined;
    const check = () => {
      const { state, view } = editor;
      const { $from, empty } = state.selection;
      if (!empty || !$from.parent.isTextblock || $from.parent.type.name === 'codeBlock') { setMenu(null); return; }
      const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼');
      const match = /(?:^|\s)\/([^\s/]{0,12})$/.exec(before);
      if (!match) { setMenu(null); return; }
      const from = $from.pos - match[1].length - 1;
      const coords = view.coordsAtPos(from);
      setMenu((prev) => ({
        query: match[1], from, to: $from.pos,
        top: coords.bottom + 6, left: coords.left,
        index: prev && prev.query === match[1] ? prev.index : 0,
      }));
    };
    const onBlur = () => setTimeout(() => setMenu(null), 120);
    editor.on('update', check);
    editor.on('selectionUpdate', check);
    editor.on('blur', onBlur);
    return () => { editor.off('update', check); editor.off('selectionUpdate', check); editor.off('blur', onBlur); };
  }, [editor]);

  const items = menu ? filterBlocks(menu.query) : [];

  const choose = (block) => {
    const m = menuRef.current;
    if (!m || !block) return;
    const chain = editor.chain().focus().deleteRange({ from: m.from, to: m.to });
    setMenu(null);
    if (block.special === 'image') { chain.run(); onPickImage(); return; }
    block.run(chain).run();
  };

  // 에디터 keydown에서 먼저 호출된다. true를 돌려주면 에디터 기본 동작을 막는다.
  const handleKey = (event) => {
    const m = menuRef.current;
    if (!m) return false;
    const list = filterBlocks(m.query);
    if (!list.length) return false;
    if (event.key === 'ArrowDown') { setMenu({ ...m, index: (m.index + 1) % list.length }); return true; }
    if (event.key === 'ArrowUp') { setMenu({ ...m, index: (m.index - 1 + list.length) % list.length }); return true; }
    if (event.key === 'Enter') { choose(list[m.index] || list[0]); return true; }
    if (event.key === 'Escape') { setMenu(null); return true; }
    return false;
  };

  const element = menu && items.length > 0 ? (
    <div className="slash-menu" style={{ top: menu.top, left: menu.left }} role="listbox">
      <div className="slash-caption">블록</div>
      {items.map((b, i) => (
        <button
          key={b.id} role="option" aria-selected={i === menu.index}
          className={`slash-item${i === menu.index ? ' on' : ''}`}
          onMouseDown={(e) => e.preventDefault()} onClick={() => choose(b)}
          onMouseEnter={() => setMenu({ ...menu, index: i })}
        >
          <span>{b.label}</span>
          {b.hint && <span className="slash-hint">{b.hint}</span>}
        </button>
      ))}
    </div>
  ) : null;

  return { element, handleKey };
}

// 사진을 누르거나 표 안에 커서가 있을 때 뜨는 메뉴 (모바일에서는 키보드로 지우기 어려워서 버튼으로 제공)
export function BlockBubble({ editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({ image: e.isActive('image'), table: e.isActive('table') }),
  });
  const chain = () => editor.chain().focus();
  const TextButton = ({ label, onClick, danger }) => (
    <button type="button" className={`bubble-text${danger ? ' danger' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {label}
    </button>
  );
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="blockBubble"
      options={{ placement: 'top', offset: 8 }}
      shouldShow={({ editor: e }) => e.isEditable && (e.isActive('image') || (e.isActive('table') && e.state.selection.empty))}
      className="bubble bubble-block"
    >
      {state.image ? (
        <TextButton label={<><Trash2 size={14} /> 사진 삭제</>} danger onClick={() => chain().deleteSelection().run()} />
      ) : state.table ? (
        <>
          <TextButton label="+ 행" onClick={() => chain().addRowAfter().run()} />
          <TextButton label="− 행" onClick={() => chain().deleteRow().run()} />
          <span className="tool-sep" />
          <TextButton label="+ 열" onClick={() => chain().addColumnAfter().run()} />
          <TextButton label="− 열" onClick={() => chain().deleteColumn().run()} />
          <span className="tool-sep" />
          <TextButton label={<><Trash2 size={14} /> 표 삭제</>} danger onClick={() => chain().deleteTable().run()} />
        </>
      ) : null}
    </BubbleMenu>
  );
}
