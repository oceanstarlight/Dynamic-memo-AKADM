import { ArrowLeft } from 'lucide-react';
import { navigate } from '../lib/router';

export const openNav = () => window.dispatchEvent(new Event('dm:nav'));

// 모든 화면 공통 상단 바: [메뉴(모바일)] [← 뒤로] [경로] ........ [동작 버튼]
// back은 '상위 화면' 경로라서 어느 화면에서 와도 같은 곳으로 간다
export default function PageBar({ back, crumbs = [], children }) {
  return (
    <div className="pagebar">
      <div className="pagebar-left">
        <button className="icon-btn nav-toggle" onClick={openNav} aria-label="메뉴 열기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
        </button>
        {back && (
          <button className="icon-btn back-btn" onClick={() => navigate(back)} aria-label="뒤로" title="뒤로">
            <ArrowLeft size={17} />
          </button>
        )}
        <nav className="crumbs" aria-label="현재 위치">
          {crumbs.map((c, i) => (
            <span key={i} className="crumb">
              {i > 0 && <span className="crumb-sep">/</span>}
              {c.href && i < crumbs.length - 1 ? <a href={`#${c.href}`}>{c.label}</a> : <span className="crumb-current">{c.label}</span>}
            </span>
          ))}
        </nav>
      </div>
      {children && <div className="pagebar-right">{children}</div>}
    </div>
  );
}
