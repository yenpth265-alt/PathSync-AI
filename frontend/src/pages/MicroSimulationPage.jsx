import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Bot, RefreshCw, Award, Gauge, SpellCheck, Layers, Lightbulb, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { aiSimulateInterview } from '../services/api';

// Simple word-boundary filler-word detection, not exhaustive linguistics —
// labeled as an estimate in the UI. Picked for being almost never meaningful
// content on their own, to keep false positives low (deliberately excludes
// words like Vietnamese "thì", which is grammatically load-bearing in many
// sentences and would flag constantly if included).
const FILLER_WORDS = {
  vi: ['ừm', 'ờ', 'ừ', 'kiểu như', 'nói chung là', 'thì là'],
  en: ['um', 'uh', 'you know', 'sort of', 'kind of', 'i mean']
};

// countTokenSequence counts non-overlapping occurrences of `needle` (already
// a list of lowercase tokens) inside `tokens`. Token-by-token comparison
// rather than a regex \b boundary deliberately — JS's \b is only aware of
// ASCII word characters ([A-Za-z0-9_]), so it misplaces boundaries around
// Vietnamese diacritics (e.g. inside "ừm") and silently misses every
// Vietnamese filler word if used here.
function countTokenSequence(tokens, needle) {
  let count = 0;
  for (let i = 0; i <= tokens.length - needle.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (tokens[i + j] !== needle[j]) {
        match = false;
        break;
      }
    }
    if (match) count++;
  }
  return count;
}

// Computed entirely client-side from the browser's own Speech Recognition
// timing — no server round-trip, so it costs nothing extra to compute. This
// is what makes the "tốc độ nói" (speaking pace) metric a real measurement
// instead of the LLM's qualitative guess (classic.go's InterviewSim prompt
// explicitly refuses to estimate WPM, since it only ever sees the
// transcribed text, never audio timing).
function computeSpeechMetrics(transcript, elapsedSeconds, lang) {
  const rawWords = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = rawWords.length;
  const wpm = elapsedSeconds > 0 ? Math.round((wordCount / elapsedSeconds) * 60) : null;

  const tokens = rawWords.map((w) => w.toLowerCase().replace(/[.,!?;:"'']/g, ''));
  const fillers = FILLER_WORDS[lang === 'vi' ? 'vi' : 'en'];
  let fillerCount = 0;
  for (const filler of fillers) {
    fillerCount += countTokenSequence(tokens, filler.split(/\s+/));
  }

  return { wordCount, wpm, fillerCount, elapsedSeconds };
}

export default function MicroSimulationPage({ lang = 'vi' }) {
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: lang === 'vi' 
        ? 'Chào bạn! Mình là Giám khảo AI Phỏng vấn Giả lập (Micro-Simulation). Bạn sẵn sàng chưa? Hãy giới thiệu bản thân và lý do bạn muốn ứng tuyển ngành Computer Science tại Harvard University nhé!' 
        : 'Welcome! I am your AI Interviewer for this Micro-Simulation. Tell me about yourself and why you wish to apply for Computer Science at Harvard University!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const recordingStartRef = useRef(null);
  const [speechMetrics, setSpeechMetrics] = useState(null);

  // Real-time interview metrics — null until the AI has actually analyzed a
  // response. Showing "94% grammar accuracy" before the user has said
  // anything was fabricated data with nothing behind it.
  const [metrics, setMetrics] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    const newHistory = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);
    setInput('');
    setIsSimulating(true);

    try {
      const response = await aiSimulateInterview(messages, userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: response.next_question }]);
      if (response.metrics) {
        setMetrics({
          pace: response.metrics.pace || null,
          grammar: response.metrics.grammar || null,
          structure: response.metrics.structure || null,
          impactScore: response.metrics.impact_score ?? null
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(lang === 'vi' ? 'Lỗi kết nối AI phỏng vấn.' : 'AI Interviewer connection error.');
      setMessages(prev => [...prev, { role: 'ai', content: lang === 'vi' ? 'Xin lỗi, tôi đang gặp trục trặc kỹ thuật. Vui lòng nói lại nhé!' : 'Sorry, I encountered a technical issue. Could you repeat?' }]);
    } finally {
      setIsSimulating(false);
    }
  };

  const toggleRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(lang === 'vi' ? 'Trình duyệt của bạn không hỗ trợ nhận diện giọng nói Web Speech API.' : 'Web Speech API is not supported in your browser.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        recordingStartRef.current = performance.now();
        toast.success(lang === 'vi' ? '🎙️ Đang lắng nghe giọng nói của bạn...' : '🎙️ Listening to your voice...');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const elapsedSeconds = recordingStartRef.current ? (performance.now() - recordingStartRef.current) / 1000 : 0;
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
        // Too-short recordings (a false trigger, a single word) produce a
        // meaningless WPM — skip rather than show a wild number.
        if (elapsedSeconds > 1) {
          setSpeechMetrics(computeSpeechMetrics(transcript, elapsedSeconds, lang));
        }
        toast.success(lang === 'vi' ? `Đã ghi nhận: "${transcript}"` : `Captured: "${transcript}"`);
      };

      recognition.onerror = (event) => {
        console.error("Speech error", event.error);
        setIsRecording(false);
        toast.error(lang === 'vi' ? 'Lỗi khi nhận diện giọng nói' : 'Speech recognition error');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', height: 'calc(100vh - 120px)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Main Chat / Voice Interview Room */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {/* Room Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-foreground)', flexShrink: 0 }}>
              <Bot size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                {lang === 'vi' ? 'Phỏng Vấn Giả Lập AI' : 'AI Mock Interview'}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                {lang === 'vi' ? 'AI phân tích câu trả lời của bạn theo thời gian thực' : 'AI analyzes your responses in real time'}
              </span>
            </div>
          </div>
        </div>

        {/* Conversation Stream */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              {m.role === 'ai' && (
                <div style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-md)', background: 'var(--secondary)', color: 'var(--primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={15} />
                </div>
              )}
              <div style={{
                padding: '14px 18px', borderRadius: '18px', fontSize: '14px', lineHeight: '1.6',
                background: m.role === 'user' ? 'var(--primary)' : 'var(--bg-color)',
                color: m.role === 'user' ? 'var(--primary-foreground)' : 'var(--text-main)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border-color)'
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {isSimulating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <RefreshCw size={16} className="animate-spin" /> {lang === 'vi' ? 'Giám khảo AI đang lắng nghe & phân tích...' : 'AI Interviewer is analyzing...'}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={toggleRecording}
            style={{
              padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer',
              background: isRecording ? 'var(--danger)' : 'var(--secondary)',
              color: isRecording ? '#fff' : 'var(--primary)', transition: 'all 0.2s'
            }}
          >
            <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
          </button>
          <input 
            type="text" 
            placeholder={lang === 'vi' ? "Nhập câu trả lời hoặc sử dụng Micro..." : "Type response or click Mic..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--secondary)', color: 'var(--text-main)', outline: 'none' }}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-md)' }}>
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Real-time Feedback & Metrics Side Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Award size={16} color="var(--primary)" /> {lang === 'vi' ? 'Chỉ Số Đánh Giá' : 'Performance Metrics'}
          </h3>

          {!metrics ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {lang === 'vi'
                ? 'Trả lời câu hỏi đầu tiên để AI bắt đầu phân tích và hiển thị chỉ số ở đây.'
                : 'Answer the first question to see AI-analyzed metrics here.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Gauge size={14} /> {lang === 'vi' ? 'Tốc độ nói (AI nhận xét)' : 'Pace (AI comment)'}
                </span>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{metrics.pace || 'N/A'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <SpellCheck size={14} /> {lang === 'vi' ? 'Ngữ pháp' : 'Grammar'}
                </span>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{metrics.grammar || 'N/A'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} /> {lang === 'vi' ? 'Mạch logic (STAR)' : 'Structure (STAR)'}
                </span>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{metrics.structure || 'N/A'}</strong>
              </div>

              <div style={{ paddingTop: '14px', marginTop: '2px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Impact Score' : 'Impact Score'}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '30px', fontWeight: '800', color: 'var(--primary)' }}>{metrics.impactScore ?? '—'}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 100</span>
                </div>
                {typeof metrics.impactScore === 'number' && (
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--secondary)', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, metrics.impactScore))}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {speechMetrics && (
          <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Timer size={16} color="var(--primary)" /> {lang === 'vi' ? 'Đo Từ Giọng Nói (câu trả lời gần nhất)' : 'Measured From Voice (last answer)'}
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {lang === 'vi'
                ? 'Đo trực tiếp trên trình duyệt, không qua AI — chỉ áp dụng khi bạn dùng Micro, không áp dụng khi gõ tay.'
                : 'Measured directly in your browser, not by AI — only applies when you use the Mic, not when typing.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Tốc độ nói' : 'Speaking pace'}</span>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{speechMetrics.wpm != null ? `${speechMetrics.wpm} ${lang === 'vi' ? 'từ/phút' : 'wpm'}` : 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Từ đệm phát hiện (ước tính)' : 'Filler words detected (estimate)'}</span>
                <strong style={{ fontSize: '13px', color: speechMetrics.fillerCount > 2 ? 'var(--warning)' : 'var(--text-main)' }}>{speechMetrics.fillerCount}</strong>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: 'var(--secondary)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lightbulb size={14} color="var(--primary)" /> {lang === 'vi' ? 'Mẹo Phỏng Vấn Tuyển Sinh' : 'Interview Tip'}
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {lang === 'vi' ? (
              <>Sử dụng công thức <strong style={{ color: 'var(--text-main)' }}>STAR (Situation - Task - Action - Result)</strong> khi trả lời về thành tựu cá nhân để chinh phục Hội đồng tuyển sinh!</>
            ) : (
              <>Use the <strong style={{ color: 'var(--text-main)' }}>STAR (Situation - Task - Action - Result)</strong> framework when answering about personal achievements to impress the admissions committee!</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
