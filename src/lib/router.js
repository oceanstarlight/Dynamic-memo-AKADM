import { useEffect, useState } from 'react';

// GitHub Pages에서 새로고침해도 깨지지 않게 해시 라우팅을 쓴다
// #/  #/c/:id  #/c/none  #/m/:id  #/new?c=:id  #/study/m/:id  #/study/c/:id
function parse() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { parts, params: new URLSearchParams(query) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(path, { replace = false } = {}) {
  const hash = `#${path}`;
  if (replace) window.history.replaceState(null, '', hash);
  else window.location.hash = path;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export const openImport = () => window.dispatchEvent(new Event('dm:import'));
