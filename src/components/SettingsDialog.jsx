import { useApp } from '../AppContext';
import { SETTING_LABELS } from '../lib/settings';
import { GEMINI_MODEL, hasGeminiKey } from '../lib/gemini';
import { Modal } from './common';

export default function SettingsDialog({ onClose }) {
  const { settings, updateSettings, isGuest } = useApp();
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

      <p className="settings-foot">
        AI 모델 {GEMINI_MODEL} · {hasGeminiKey() ? 'API 키 연결됨' : 'API 키 없음 (GEMINI_API_KEY)'}
      </p>
    </Modal>
  );
}
