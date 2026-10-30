// dist-extension → 배포용 zip 2개
//   dynamic-memo-ext-<버전>-store.zip : 웹 스토어 업로드용 (manifest의 key 제거. 스토어가 ID를 정해 줌)
//   dynamic-memo-ext-<버전>.zip       : '압축해제된 확장 로드'용 (key 포함 → 스토어와 같은 ID라 로그인 가능)
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { zipSync } from 'fflate';

const DIST = 'dist-extension';
const OUT = 'release';

function collect(dir, files = {}) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collect(full, files);
    else files[relative(DIST, full).split('\\').join('/')] = readFileSync(full);
  }
  return files;
}

const files = collect(DIST);
const manifest = JSON.parse(files['manifest.json'].toString());
const { key, ...storeManifest } = manifest;
const base = `dynamic-memo-ext-${manifest.version}`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, `${base}.zip`), zipSync(files, { level: 9 }));
writeFileSync(
  join(OUT, `${base}-store.zip`),
  zipSync({ ...files, 'manifest.json': Buffer.from(`${JSON.stringify(storeManifest, null, 2)}\n`) }, { level: 9 }),
);

console.log(`${OUT}/${base}.zip ${key ? '(key 포함)' : '(key 없음: 로컬 설치 시 ID가 매번 달라질 수 있음)'}`);
console.log(`${OUT}/${base}-store.zip (웹 스토어 업로드용)`);
if (!manifest.oauth2) console.warn('경고: oauth2 client_id가 없습니다. EXT_OAUTH_CLIENT_ID를 설정하세요.');
