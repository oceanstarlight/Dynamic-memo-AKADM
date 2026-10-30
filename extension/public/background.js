// Dynamic Memo 확장 서비스 워커
// 우클릭 메뉴로 담은 글은 chrome.storage.local 대기열(dm-clips)에 넣고, 사이드 패널이 꺼내서 저장 · 분류한다
const CLIP_KEY = 'dm-clips';
const CLIP_LOCK = 'dm-clips';
const MAX_CLIP = 20000;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'dm-save-selection', title: '선택한 글을 Dynamic Memo에 저장', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'dm-save-page', title: '이 페이지를 Dynamic Memo에 저장', contexts: ['page'] });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  // 사용자 동작 직후에만 열 수 있어서 다른 작업보다 먼저 부른다
  if (tab?.windowId != null) chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  collect(info, tab).then(addClip).catch((error) => console.error('[Dynamic Memo]', error));
});

async function collect(info, tab) {
  const url = /^https?:/.test(info.pageUrl || tab?.url || '') ? (info.pageUrl || tab.url) : '';
  const title = tab?.title || url;
  if (info.menuItemId === 'dm-save-page') return { kind: 'page', title, url, text: '' };

  // selectionText는 줄바꿈이 사라지므로 가능하면 페이지에서 직접 읽는다
  let text = info.selectionText || '';
  if (tab?.id != null) {
    try {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id, frameIds: info.frameId != null ? [info.frameId] : undefined },
        func: () => window.getSelection()?.toString() || '',
      });
      if (res?.result?.trim()) text = res.result;
    } catch {
      // chrome:// 같은 페이지는 스크립트를 못 넣는다 → selectionText 사용
    }
  }
  return { kind: 'selection', title, url, text: text.slice(0, MAX_CLIP) };
}

function addClip(clip) {
  return navigator.locks.request(CLIP_LOCK, async () => {
    const { [CLIP_KEY]: clips = [] } = await chrome.storage.local.get(CLIP_KEY);
    clips.push({ ...clip, id: crypto.randomUUID(), at: Date.now() });
    await chrome.storage.local.set({ [CLIP_KEY]: clips.slice(-50) });
  });
}
