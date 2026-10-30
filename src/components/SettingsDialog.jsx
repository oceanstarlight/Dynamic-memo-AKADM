import { useApp } from '../AppContext';
import { Download } from 'lucide-react';
import { FEATURE_LABELS, SETTING_LABELS } from '../lib/settings';
import { downloadMemosZip } from '../lib/exportMd';
import { GEMINI_MODEL, hasGeminiKey } from '../lib/gemini';
import { Modal } from './common';

export default function SettingsDialog({ onClose }) {
  const { settings, updateSettings, isGuest, memos, categories, toast } = useApp();

  const exportAll = () => {
    if (!memos.length) { toast('내보낼 메모가 없어요.'); return; }
    downloadMemosZip(memos, 'dynamic-memo', (m) => categories.find((c) => c.id === m.categoryId)?.name || '미분류');
  };
  return (
    <Modal onClose={onClose} className="settings" label="설정">
      <div className="modal-head">
        <h2>설정</h2>
        <button className="icon-btn" onClick={onClose} aria-label="닫기">×</button>
      </div>

      <section className="settings-sec">
        <h3>자동 기능</h3>
        <p className="settings-hint">기본은 모두 자동이에요. 끄면 같은 작업을 메모 화면에서 직접 할 수 있어요.</p>
        {Object.entries(SETTING_LABELS).map(([key, [label, desc]]) => {
          const locked = key === 'autoSave' && isGuest;
          const dependsOff = (key === 'autoCategorize' || key === 'autoTitle') && !settings.autoAnalyze;
          return (
            <label key={key} className={`switch-row${locked || dependsOff ? ' dim' : ''}`}>
              <span>
                <span className="switch-label">{label}</span>
                <span className="switch-desc">{locked ? '게스트 모드에서는 자동 저장을 쓰지 않아요.' : desc}</span>
              </span>
              <input
                type="checkbox" className="switch" role="switch"
                checked={!!settings[key]} disabled={locked}
                onChange={(e) => updateSettings({ [key]: e.target.checked })}
              />
            </label>
          );
        })}
      </section>

      <section className="settings-sec">
        <h3>추가 기능</h3>
        <p className="settings-hint">필요 없는 기능은 꺼 두면 메뉴와 화면에서 사라져요.</p>
        {Object.entries(FEATURE_LABELS).map(([key, [label, desc]]) => (
          <label key={key} className="switch-row">
            <span>
              <span className="switch-label">{label}</span>
              <span className="switch-desc">{desc}</span>
            </span>
            <input
              type="checkbox" className="switch" role="switch"
              checked={!!settings[key]}
              onChange={(e) => updateSettings({ [key]: e.target.checked })}
            />
          </label>
        ))}
      </section>

      <section className="settings-sec">
        <h3>화면</h3>
        <div className="switch-row">
          <span className="switch-label">테마</span>
          <div className="segmented">
            {[['system', '시스템'], ['light', '라이트'], ['dark', '다크']].map(([v, l]) => (
              <button key={v} className={settings.theme === v ? 'on' : ''} onClick={() => updateSettings({ theme: v })}>{l}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-sec">
        <h3>데이터</h3>
        <div className="switch-row">
          <span>
            <span className="switch-label">전체 메모 내보내기</span>
            <span className="switch-desc">카테고리별 폴더에 .md 파일로 담은 zip을 받아요.</span>
          </span>
          <button className="btn btn-sm" onClick={exportAll}><Download size={13} /> 내보내기</button>
        </div>
      </section>

      <p className="settings-foot">
        AI 모델 {GEMINI_MODEL} · {hasGeminiKey() ? 'API 키 연결됨' : 'API 키 없음 (GEMINI_API_KEY)'}
      </p>
    </Modal>
  );
}
