// Tab 들여쓰기 공통 규칙: 공백 4칸. 여러 줄을 고르면 줄마다 들여쓰고, Shift+Tab은 줄 앞 공백을 최대 4칸 지운다
export const INDENT = '    ';
// 일반 문단은 HTML로 저장 · 불러올 때 앞 공백이 사라지므로 줄바꿈 없는 공백(nbsp)으로 넣는다. 코드 블록은 일반 공백
export const SOFT_INDENT = '\u00a0'.repeat(4);

// 줄 앞 공백 개수 (최대 4칸, nbsp 포함)
export function leadingSpaces(text) {
  let n = 0;
  while (n < INDENT.length && (text[n] === ' ' || text[n] === '\u00a0')) n += 1;
  return n;
}

// textarea용: 값과 선택 범위를 받아 들여쓰기/내어쓰기한 결과를 돌려준다
export function indentTextarea(value, start, end, outdent) {
  const multiLine = value.slice(start, end).includes('\n');
  if (!outdent && !multiLine) {
    const next = value.slice(0, start) + INDENT + value.slice(end);
    const caret = start + INDENT.length;
    return { value: next, start: caret, end: caret };
  }
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  // 선택이 줄 맨 앞에서 끝나면 그 줄은 건드리지 않는다
  const blockEnd = end > start && value[end - 1] === '\n' ? end - 1 : end;
  const lines = value.slice(lineStart, blockEnd).split('\n');
  let newStart = start;
  let newEnd = end;
  let offset = 0;
  const changed = lines.map((line, i) => {
    const lineAt = lineStart + offset;
    offset += line.length + 1;
    if (!outdent) {
      if (i === 0) newStart += INDENT.length;
      newEnd += INDENT.length;
      return INDENT + line;
    }
    const n = leadingSpaces(line);
    if (i === 0) newStart -= Math.min(n, Math.max(0, start - lineAt));
    newEnd -= Math.min(n, Math.max(0, end - lineAt));
    return line.slice(n);
  });
  const next = value.slice(0, lineStart) + changed.join('\n') + value.slice(blockEnd);
  return { value: next, start: Math.max(lineStart, newStart), end: Math.max(lineStart, newEnd) };
}
