import { useEffect } from 'react';
import { MIN_AI_LENGTH, useApp } from '../../src/AppContext';
import { escapeHtml, plainToHtml } from '../../src/lib/text';
import { onClipsAdded, takeClips } from './chromeApi';

// 우클릭으로 담은 글을 메모로 저장한다. 빠른 메모와 같은 자동 설정(요약 · 분류 · 학습 카드)을 따른다
function clipToMemo(clip) {
  const title = (clip.title || clip.url || '').trim();
  const body = (clip.text || '').trim();
  const link = clip.url
    ? `<a href="${escapeHtml(clip.url)}">${escapeHtml(title || clip.url)}</a>`
    : escapeHtml(title);
  const html = `${plainToHtml(body)}<p>출처: ${link}</p>`;
  const text = [body, `출처: ${title}${clip.url && clip.url !== title ? ` (${clip.url})` : ''}`].filter(Boolean).join('\n\n');
  return { text, html, source: { name: title || '웹 페이지', kind: 'web', url: clip.url || '' } };
}

export default function ClipInbox() {
  const { loaded, quickCapture, toast, settings } = useApp();

  useEffect(() => {
    if (!loaded) return undefined; // 카테고리를 다 받은 뒤에 분류해야 기존 카테고리를 재사용한다
    let running = false;
    let again = false;
    const drain = async () => {
      if (running) { again = true; return; }
      running = true;
      try {
        do {
          again = false;
          const clips = await takeClips();
          for (const clip of clips) {
            const { text, html, source } = clipToMemo(clip);
            try {
              const memoId = await quickCapture(text, { html, source });
              // AI가 정리하면 분류 결과 안내가 따로 뜨므로, 정리하지 않는 짧은 글만 여기서 알린다
              if (settings.autoAnalyze && text.length < MIN_AI_LENGTH) {
                toast('웹에서 담은 글을 저장했어요', { action: { label: '열기', href: `/m/${memoId}` } });
              }
            } catch (error) {
              toast(`저장 실패: ${error.message}`, { tone: 'error' });
            }
          }
        } while (again);
      } finally {
        running = false;
      }
    };
    drain();
    return onClipsAdded(drain);
  }, [loaded, quickCapture, toast, settings.autoAnalyze]);

  return null;
}
