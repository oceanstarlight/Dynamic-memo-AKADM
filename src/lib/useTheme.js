import { useEffect } from 'react';

export function useTheme(theme) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
    else delete root.dataset.theme;
    // 모바일 브라우저 상단 바 색도 배경에 맞춘다
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(document.body).backgroundColor;
  }, [theme]);
}
