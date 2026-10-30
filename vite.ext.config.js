import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 크롬 확장 빌드: 웹앱 코드(src/)를 그대로 쓰고, 확장에서 못 쓰는 부분만 바꿔 끼운다
//   - firebase/auth → firebase/auth/web-extension (MV3는 원격 스크립트를 못 불러서 팝업 로그인이 안 됨)
//   - components/Login → extension/src/ExtLogin (chrome.identity로 Google 로그인)
const r = (p) => fileURLToPath(new URL(p, import.meta.url));
const pkg = JSON.parse(readFileSync(r('package.json'), 'utf8'));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, r('.'), '');

  const icons = { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png', 48: 'icons/icon-48.png', 128: 'icons/icon-128.png' };
  const manifest = {
    manifest_version: 3,
    name: 'Dynamic Memo',
    version: pkg.version,
    description: '떠오른 생각과 웹에서 본 글을 바로 메모하세요. AI가 분류 · 요약 · 학습 카드까지 정리해 드립니다.',
    minimum_chrome_version: '116',
    icons,
    action: { default_popup: 'popup.html', default_title: 'Dynamic Memo 빠른 메모', default_icon: icons },
    side_panel: { default_path: 'sidepanel.html' },
    background: { service_worker: 'background.js' },
    permissions: ['identity', 'contextMenus', 'sidePanel', 'storage', 'activeTab', 'scripting'],
    commands: {
      _execute_action: { suggested_key: { default: 'Alt+Shift+M' }, description: '빠른 메모 열기' },
    },
    // 'Chrome 확장 프로그램' 유형 OAuth 클라이언트 ID (EXTENSION.md 2단계)
    ...(env.EXT_OAUTH_CLIENT_ID && {
      oauth2: { client_id: env.EXT_OAUTH_CLIENT_ID, scopes: ['openid', 'email', 'profile'] },
    }),
    // 웹 스토어와 같은 확장 ID를 로컬에서도 쓰기 위한 공개 키. 스토어용 zip에서는 뺀다 (scripts/zip-extension.mjs)
    ...(env.EXT_PUBLIC_KEY && { key: env.EXT_PUBLIC_KEY }),
  };

  return {
    root: r('extension'),
    envDir: r('.'),
    publicDir: r('extension/public'),
    base: './',
    plugins: [
      react(),
      {
        name: 'dm-manifest',
        generateBundle() {
          if (!env.EXT_OAUTH_CLIENT_ID) this.warn('EXT_OAUTH_CLIENT_ID가 없어 Google 로그인이 동작하지 않습니다 (게스트만 가능).');
          this.emitFile({ type: 'asset', fileName: 'manifest.json', source: `${JSON.stringify(manifest, null, 2)}\n` });
        },
      },
    ],
    resolve: {
      alias: [
        { find: /^firebase\/auth$/, replacement: 'firebase/auth/web-extension' },
        { find: /^\.\/components\/Login$/, replacement: r('extension/src/ExtLogin.jsx') },
      ],
    },
    build: {
      outDir: r('dist-extension'),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        input: { sidepanel: r('extension/sidepanel.html'), popup: r('extension/popup.html') },
      },
    },
  };
});
