// 슬래시 메뉴와 서식 바가 함께 쓰는 블록 목록
export const BLOCKS = [
  { id: 'p', label: '텍스트', hint: '일반 문단', keys: 'text p 텍스트 본문', run: (c) => c.setParagraph() },
  { id: 'h1', label: '제목', hint: '# + 스페이스', keys: 'h1 heading 제목 title', run: (c) => c.toggleHeading({ level: 1 }) },
  { id: 'h2', label: '부제목', hint: '## + 스페이스', keys: 'h2 subtitle 부제목 소제목', run: (c) => c.toggleHeading({ level: 2 }) },
  { id: 'h3', label: '작은 제목', hint: '### + 스페이스', keys: 'h3 작은제목', run: (c) => c.toggleHeading({ level: 3 }) },
  { id: 'ul', label: '글머리 목록', hint: '- + 스페이스', keys: 'bullet list ul 목록 글머리', run: (c) => c.toggleBulletList() },
  { id: 'ol', label: '번호 목록', hint: '1. + 스페이스', keys: 'number ordered ol 번호', run: (c) => c.toggleOrderedList() },
  { id: 'todo', label: '할 일 목록', hint: '[] + 스페이스', keys: 'todo task check 할일 체크', run: (c) => c.toggleTaskList() },
  { id: 'quote', label: '인용', hint: '> + 스페이스', keys: 'quote 인용', run: (c) => c.toggleBlockquote() },
  { id: 'code', label: '코드 블록', hint: '``` ', keys: 'code 코드', run: (c) => c.toggleCodeBlock() },
  { id: 'hr-thin', label: '구분선 · 얇게', hint: '', keys: 'hr divider line 구분선 선 얇게', run: (c) => c.insertContent({ type: 'horizontalRule', attrs: { weight: 'thin' } }) },
  { id: 'hr', label: '구분선 · 보통', hint: '---', keys: 'hr divider line 구분선 선 보통', run: (c) => c.setHorizontalRule() },
  { id: 'hr-thick', label: '구분선 · 굵게', hint: '', keys: 'hr divider line 구분선 선 굵게 굵기', run: (c) => c.insertContent({ type: 'horizontalRule', attrs: { weight: 'thick' } }) },
  { id: 'table', label: '표', hint: '3 × 3', keys: 'table 표', run: (c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }) },
  { id: 'image', label: '사진', hint: '파일 업로드', keys: 'image photo 사진 이미지 그림', special: 'image' },
];

export const HIGHLIGHTS = [
  { name: '노랑', color: 'rgba(250, 204, 21, .38)' },
  { name: '초록', color: 'rgba(74, 222, 128, .32)' },
  { name: '파랑', color: 'rgba(96, 165, 250, .32)' },
  { name: '분홍', color: 'rgba(244, 114, 182, .3)' },
  { name: '보라', color: 'rgba(167, 139, 250, .32)' },
];

export const TEXT_COLORS = [
  { name: '회색', color: '#8a877f' },
  { name: '빨강', color: '#d1453b' },
  { name: '주황', color: '#d9730d' },
  { name: '초록', color: '#2f8a4f' },
  { name: '파랑', color: '#2f6fbd' },
  { name: '보라', color: '#7b52c7' },
];

export function filterBlocks(query) {
  const q = query.trim().toLowerCase();
  if (!q) return BLOCKS;
  return BLOCKS.filter((b) => b.label.toLowerCase().includes(q) || b.keys.includes(q));
}
