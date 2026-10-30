import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { strToU8, zipSync } from 'fflate';
import { memoTitle } from './text';

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', hr: '---' });
turndown.use(gfm);
// Tiptap 할 일 목록 → - [ ] / - [x]
turndown.addRule('taskItem', {
  filter: (node) => node.nodeName === 'LI' && node.getAttribute('data-type') === 'taskItem',
  replacement: (content, node) => `- [${node.getAttribute('data-checked') === 'true' ? 'x' : ' '}] ${content.trim().replace(/\n+/g, ' ')}\n`,
});
turndown.addRule('highlight', { filter: 'mark', replacement: (content) => `==${content}==` });

export function memoToMarkdown(memo) {
  const body = turndown.turndown(memo.html || '');
  return `# ${memoTitle(memo)}\n\n${body}\n`;
}

const safeName = (name) => name.replace(/[\\/:*?"<>|\n\r]+/g, ' ').trim().slice(0, 80) || '메모';

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadMemo(memo) {
  download(new Blob([memoToMarkdown(memo)], { type: 'text/markdown;charset=utf-8' }), `${safeName(memoTitle(memo))}.md`);
}

// 여러 메모 → zip (폴더 = 카테고리)
export function downloadMemosZip(memos, zipName, folderOf = () => '') {
  const files = {};
  const used = new Set();
  memos.forEach((memo) => {
    const folder = folderOf(memo);
    const base = `${folder ? `${safeName(folder)}/` : ''}${safeName(memoTitle(memo))}`;
    let path = `${base}.md`;
    for (let i = 2; used.has(path); i++) path = `${base} (${i}).md`;
    used.add(path);
    files[path] = strToU8(memoToMarkdown(memo));
  });
  download(new Blob([zipSync(files)], { type: 'application/zip' }), `${safeName(zipName)}.zip`);
}
