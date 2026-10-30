import { useEffect, useRef, useState } from 'react';
import { Mic, Square, RotateCcw, Play, FileText, X } from 'lucide-react';
import { transcribeAudio } from '../lib/gemini';
import { Spinner } from '../components/common';

// 실시간 받아쓰기: 브라우저 내장 음성 인식(휴대폰은 기기 자체 인식, 데스크톱은 기본 마이크) 사용.
// 지원하지 않는 브라우저(예: Firefox)는 기본 마이크로 녹음한 뒤 Gemini로 받아쓴다.
const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
const canRecord = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!window.MediaRecorder;
export const VOICE_MODE = SpeechRecognition ? 'live' : canRecord ? 'record' : 'none';
const MODE_KEY = 'dm-voice-mode';
const MAX_RECORD_SEC = 5 * 60; // 녹음 → AI 받아쓰기는 비용 때문에 최대 5분

// 아이폰 Safari처럼 실시간 인식이 막혀 있던 기기는 다음부터 바로 녹음 방식으로 시작한다
function initialMode() {
  try {
    if (VOICE_MODE === 'live' && canRecord && localStorage.getItem(MODE_KEY) === 'record') return 'record';
  } catch { /* 무시 */ }
  return VOICE_MODE;
}

const ERROR_TEXT = {
  'not-allowed': '마이크 권한이 필요해요. 브라우저 설정에서 이 사이트의 마이크 사용을 허용해 주세요.',
  'service-not-allowed': '이 기기에서 음성 인식을 사용할 수 없어요. 설정에서 받아쓰기(음성 인식)가 켜져 있는지 확인해 주세요.',
  'audio-capture': '마이크를 찾을 수 없어요. 마이크가 연결되어 있는지 확인해 주세요.',
  network: '음성 인식 서버에 연결하지 못했어요. 네트워크를 확인해 주세요.',
  NotAllowedError: '마이크 권한이 필요해요. 브라우저 설정에서 이 사이트의 마이크 사용을 허용해 주세요.',
  NotFoundError: '마이크를 찾을 수 없어요. 마이크가 연결되어 있는지 확인해 주세요.',
};

const joinText = (prev, next) => {
  const a = prev.trimEnd();
  const b = next.trim();
  if (!b) return a;
  return a ? `${a} ${b}` : b;
};

const formatClock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

// text / setText는 메모 화면이 들고 있어서, 패널을 닫았다 열어도 받아쓴 내용이 남는다
export default function VoicePanel({ text, setText, onInsert, onClose }) {
  const [status, setStatus] = useState(text ? 'stopped' : 'idle'); // idle | recording | transcribing | stopped
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [mode, setMode] = useState(initialMode);
  const [notice, setNotice] = useState('');

  const keepListeningRef = useRef(false);
  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const stopTimer = () => clearInterval(timerRef.current);
  const startTimer = () => {
    stopTimer();
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  // 녹음 방식은 5분이 되면 자동으로 멈추고 받아쓴다
  useEffect(() => {
    if (status === 'recording' && mode === 'record' && seconds >= MAX_RECORD_SEC) stopRef.current();
  }, [seconds, status, mode]);

  const releaseMic = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // 패널이 닫히거나 메모를 떠나면 마이크를 반드시 끈다
  useEffect(() => () => {
    keepListeningRef.current = false;
    stopTimer();
    try { recognitionRef.current?.abort(); } catch { /* 무시 */ }
    try { if (recorderRef.current?.state === 'recording') recorderRef.current.stop(); } catch { /* 무시 */ }
    releaseMic();
  }, []);

  const fail = (code, fallback) => {
    keepListeningRef.current = false;
    stopTimer();
    setError(ERROR_TEXT[code] || fallback || `음성 인식 오류 (${code})`);
    setInterim('');
    setStatus('stopped');
  };

  const startLive = () => {
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let pending = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) setText((prev) => joinText(prev, result[0].transcript));
        else pending += result[0].transcript;
      }
      setInterim(pending);
    };
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return; // 잠깐 조용했던 것뿐
      // 기기가 웹의 실시간 인식을 막아 둔 경우(아이폰 Safari 등) → 녹음 후 AI 받아쓰기로 전환
      if ((event.error === 'service-not-allowed' || event.error === 'language-not-supported') && canRecord) {
        keepListeningRef.current = false;
        stopTimer();
        try { localStorage.setItem(MODE_KEY, 'record'); } catch { /* 무시 */ }
        setMode('record');
        setInterim('');
        setStatus(text ? 'stopped' : 'idle');
        setNotice('이 기기는 실시간 받아쓰기를 지원하지 않아서, 녹음한 뒤 AI가 받아쓰는 방식으로 바꿨어요. 버튼을 한 번 더 눌러 녹음을 시작해 주세요.');
        return;
      }
      fail(event.error);
    };
    // 휴대폰은 말이 끊기면 인식이 저절로 끝나므로, 녹음 중이면 다시 이어서 듣는다
    recognition.onend = () => {
      if (keepListeningRef.current) {
        try { recognition.start(); return; } catch { /* 아래에서 종료 처리 */ }
      }
      stopTimer();
      setInterim('');
      setStatus('stopped');
    };
    recognitionRef.current = recognition;
    recognition.start(); // 처음 실행이면 여기서 마이크 권한을 묻는다
  };

  const startRecord = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // 기본 녹음 장치
    streamRef.current = stream;
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      releaseMic();
      stopTimer();
      setStatus('transcribing');
      try {
        const spoken = await transcribeAudio(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }), MAX_RECORD_SEC);
        setText((prev) => joinText(prev, spoken));
      } catch (e) {
        setError(/빈 응답|STOP/.test(e.message) ? '말소리를 알아듣지 못했어요. 다시 녹음해 주세요.' : `받아쓰기 실패: ${e.message}`);
      }
      setStatus('stopped');
    };
    recorderRef.current = recorder;
    recorder.start();
  };

  const start = async (fresh) => {
    if (fresh) setText('');
    setError('');
    setNotice('');
    setInterim('');
    keepListeningRef.current = true;
    try {
      if (mode === 'live') startLive();
      else await startRecord();
      setStatus('recording');
      startTimer();
    } catch (e) {
      fail(e.name || e.error, `마이크를 시작하지 못했어요: ${e.message}`);
    }
  };

  const stop = () => {
    keepListeningRef.current = false;
    if (mode === 'live') {
      // 말하던 중이던 마지막 문장도 확정되도록 stop (onend에서 상태 정리)
      try { recognitionRef.current?.stop(); } catch { setStatus('stopped'); }
    } else if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    stopTimer();
  };
  const stopRef = useRef(stop);
  stopRef.current = stop;

  const insert = () => {
    onInsert(text.trim());
    setText('');
    setStatus('idle');
    setSeconds(0);
  };

  const recording = status === 'recording';
  const shown = joinText(text, interim);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>음성 메모</h3>
        <div className="panel-head-actions">
          <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="닫기"><X size={15} /></button>
        </div>
      </div>

      {mode === 'none' ? (
        <p className="panel-warn">이 브라우저에서는 마이크를 쓸 수 없어요. Chrome, Safari, Edge에서 열어 주세요.</p>
      ) : (
        <>
          <div className="voice-recorder">
            <button
              className={`voice-btn${recording ? ' on' : ''}`}
              onClick={recording ? stop : () => start(status === 'idle')}
              disabled={status === 'transcribing'}
              aria-label={recording ? '음성 메모 종료' : '음성 메모 시작'}
            >
              {recording ? <Square size={22} fill="currentColor" /> : <Mic size={26} />}
            </button>
            <div className="voice-state">
              {recording && <><span className="rec-dot" /> 듣는 중 · {formatClock(seconds)}</>}
              {status === 'transcribing' && <><Spinner size={12} /> 받아쓰는 중…</>}
              {status === 'idle' && '버튼을 누르면 녹음을 시작해요'}
              {status === 'stopped' && '녹음을 멈췄어요'}
            </div>
            {mode === 'record' && status === 'idle' && !notice && (
              <p className="voice-note">녹음을 마치면 AI가 한 번에 받아써요 (최대 5분).</p>
            )}
          </div>

          {notice && <p className="panel-note">{notice}</p>}
          {error && <p className="panel-error">{error}</p>}

          {recording || status === 'transcribing' ? (
            <div className="voice-live" aria-live="polite">
              {shown || <span className="muted">{mode === 'live' ? '말씀하시면 여기에 바로 적혀요' : '녹음 중이에요. 끝나면 받아쓴 내용이 나와요'}</span>}
              {interim && <span className="voice-interim" />}
            </div>
          ) : status === 'stopped' && (
            <>
              <textarea
                className="summary-edit voice-edit" rows={6} value={text}
                placeholder="받아쓴 내용이 없어요" onChange={(e) => setText(e.target.value)}
              />
              <div className="voice-actions">
                <button className="btn btn-primary btn-block" onClick={insert} disabled={!text.trim()}>
                  <FileText size={14} /> 메모에 텍스트 저장
                </button>
                <div className="voice-actions-row">
                  <button className="btn" onClick={() => start(false)}><Play size={13} /> 이어서 녹음하기</button>
                  <button className="btn" onClick={() => start(true)}><RotateCcw size={13} /> 처음부터 녹음하기</button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
