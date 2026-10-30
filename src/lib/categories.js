// 카테고리 색상: 채도를 낮춘 태그 팔레트 (라이트/다크는 CSS 변수에서 처리)
export const CATEGORY_COLORS = ['gray', 'brown', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red'];

export function pickColor(existing) {
  const used = new Set(existing.map((c) => c.color));
  return CATEGORY_COLORS.find((c) => c !== 'gray' && !used.has(c))
    || CATEGORY_COLORS[(existing.length % (CATEGORY_COLORS.length - 1)) + 1];
}

export const normalizeName = (name) => (name || '').trim().replace(/\s+/g, ' ');

export function findCategoryByName(categories, name) {
  const key = normalizeName(name).toLowerCase();
  return categories.find((c) => normalizeName(c.name).toLowerCase() === key) || null;
}
