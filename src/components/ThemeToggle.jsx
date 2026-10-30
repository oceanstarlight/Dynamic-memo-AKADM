import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../AppContext';

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

// 기본값은 시스템 설정을 따르고, 누르면 라이트 ↔ 다크로 고정 전환된다
export default function ThemeToggle({ className = '' }) {
  const { settings, updateSettings } = useApp();
  const [systemDark, setSystemDark] = useState(() => darkQuery().matches);

  useEffect(() => {
    const query = darkQuery();
    const onChange = (e) => setSystemDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark);
  const label = isDark ? '라이트 모드로 전환' : '다크 모드로 전환';
  return (
    <button className={`icon-btn ${className}`} onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })} title={label} aria-label={label}>
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
