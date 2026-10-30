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

// AI가 기존 카테고리와 거의 같은 이름(띄어쓰기·대소문자 차이, 한쪽이 다른 쪽을 포함)을 새로 만들려 하면 기존 것으로 합친다
export function matchExistingCategory(categories, name) {
  const exact = findCategoryByName(categories, name);
  if (exact) return exact;
  const key = normalizeName(name).replace(/\s/g, '').toLowerCase();
  if (key.length < 2) return null;
  return categories.find((c) => {
    const other = normalizeName(c.name).replace(/\s/g, '').toLowerCase();
    return other.length >= 2 && (other === key || other.includes(key) || key.includes(other));
  }) || null;
}
