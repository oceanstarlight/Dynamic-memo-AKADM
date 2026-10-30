// 모든 자동 기능은 기본값이 켜짐(자동 모드)이고, 설정에서 하나씩 끌 수 있다
export const DEFAULT_SETTINGS = {
  autoSave: true,        // 작성 중 자동 저장 (게스트는 항상 꺼짐)
  autoAnalyze: true,     // 작성 완료 시 AI 요약/분류 실행
  autoCategorize: true,  // AI가 제안한 카테고리를 바로 적용 (끄면 제안만 보여줌)
  autoTitle: true,       // 제목이 비어 있으면 AI 제목으로 채움
  autoStudy: true,       // 작성 완료 시 학습 카드/퀴즈 자동 생성 (별도 호출)
  theme: 'system',       // system | light | dark
};

export const SETTING_LABELS = {
  autoSave: ['자동 저장', '작성하는 동안 잠시 멈추면 클라우드에 저장해요.'],
  autoAnalyze: ['완료 시 AI 정리', "'작성 완료'를 누르면 요약 · 핵심 · 태그 · 카테고리를 만들어요."],
  autoCategorize: ['카테고리 자동 배치', '끄면 AI 제안만 보여주고 적용은 직접 해요. 필요하면 새 카테고리도 만들어요.'],
  autoTitle: ['제목 자동 생성', '제목을 비워 두면 AI가 붙여 줘요.'],
  autoStudy: ['학습 카드 자동 생성', '완료한 메모로 플래시카드와 퀴즈를 따로 만들어 둬요.'],
};

const KEY = 'dm-settings';

export function loadLocalSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveLocalSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch { /* 저장소 차단 시 무시 */ }
}
