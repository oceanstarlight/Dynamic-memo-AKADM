// 모든 자동 기능은 기본값이 켜짐(자동 모드)이고, 설정에서 하나씩 끌 수 있다
export const DEFAULT_SETTINGS = {
  autoSave: true,        // 작성 중 자동 저장 (게스트는 항상 꺼짐)
  autoAnalyze: true,     // 작성 완료 시 AI 요약/분류 실행
  autoCategorize: true,  // AI가 제안한 카테고리를 바로 적용 (끄면 제안만 보여줌)
  autoTitle: true,       // 제목이 비어 있으면 AI 제목으로 채움
  autoStudy: true,       // 작성 완료 시 학습 카드/퀴즈 자동 생성 (별도 호출)
  // 추가 기능 (필요 없으면 꺼서 화면에서 숨길 수 있다)
  quickCapture: true,    // 홈 상단 빠른 메모 입력창
  voiceMemo: true,       // 메모 화면 음성 메모(받아쓰기)
  relatedMemos: true,    // 메모 아래 관련 메모 추천
  askNotes: true,        // 내 메모에게 질문하기
  categoryOverview: true, // 카테고리 개요 노트
  todoView: true,        // 할 일 모아보기
  useTrash: true,        // 삭제 시 휴지통으로 (30일 후 영구 삭제)
  theme: 'system',       // system | light | dark
};

export const SETTING_LABELS = {
  autoSave: ['자동 저장', '작성하는 동안 잠시 멈추면 클라우드에 저장해요.'],
  autoAnalyze: ['완료 시 AI 정리', "'작성 완료'를 누르면 요약 · 핵심 · 태그 · 카테고리를 만들어요."],
  autoCategorize: ['카테고리 자동 배치', '끄면 AI 제안만 보여주고 적용은 직접 해요. 필요하면 새 카테고리도 만들어요.'],
  autoTitle: ['제목 자동 생성', '제목을 비워 두면 AI가 붙여 줘요.'],
  autoStudy: ['학습 카드 자동 생성', '완료한 메모로 플래시카드와 퀴즈를 따로 만들어 둬요.'],
};

export const FEATURE_LABELS = {
  quickCapture: ['빠른 메모', '홈 맨 위 입력창에 한 줄 적고 Enter만 누르면 저장 · 분류돼요.'],
  voiceMemo: ['음성 메모', '메모 화면 도구에 마이크 버튼이 생겨요. 말하면 바로 글자로 받아써요.'],
  relatedMemos: ['관련 메모 추천', '메모 아래에 태그 · 카테고리가 겹치는 메모를 보여줘요. (AI 호출 없음)'],
  askNotes: ['내 메모에게 질문하기', '질문하면 관련 메모를 찾아 Gemini가 출처와 함께 답해요.'],
  categoryOverview: ['카테고리 개요', '카테고리 화면에서 안의 메모들을 한 장으로 정리해요.'],
  todoView: ['할 일 모아보기', '여러 메모의 체크박스를 한 화면에 모아 보여줘요.'],
  useTrash: ['휴지통 사용', '삭제한 메모를 30일 동안 보관했다가 지워요. 끄면 바로 삭제돼요.'],
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
