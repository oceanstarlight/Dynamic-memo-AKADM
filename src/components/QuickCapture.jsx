import { useState } from 'react';
import { CornerDownLeft } from 'lucide-react';
import { useApp } from '../AppContext';
import { Spinner } from './common';

// 홈 상단 한 줄 메모: Enter로 저장, Shift+Enter는 줄바꿈. 분류는 '작성 완료'와 같은 자동 설정을 따른다
export default function QuickCapture() {
  const { quickCapture, settings, toast } = useApp();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await quickCapture(text);
      setText('');
    } catch (error) {
      toast(`저장 실패: ${error.message}`, { tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quick">
      <textarea
        className="quick-input" rows={1} value={text} placeholder="떠오른 생각을 바로 적어 두세요"
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
        }}
      />
      <div className="quick-foot">
        <span className="quick-hint">{settings.autoAnalyze ? 'Enter로 저장하면 AI가 분류해요' : 'Enter로 저장'} · Shift+Enter 줄바꿈</span>
        <button className="btn btn-sm btn-primary" onClick={submit} disabled={!text.trim() || saving}>
          {saving ? <Spinner size={11} /> : <CornerDownLeft size={13} />} 저장
        </button>
      </div>
    </div>
  );
}
