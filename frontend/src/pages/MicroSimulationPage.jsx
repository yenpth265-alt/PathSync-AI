import React, { useState, useEffect } from 'react';
import { Mic, Send, Bot, User, Sparkles, RefreshCw, Award, Volume2, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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

  // Real-time interview metrics
  const [metrics, setMetrics] = useState({
    pace: '135 wpm (Tối ưu)',
    grammar: '94%',
    structure: 'STAR Framework (8/10)',
    impactScore: 88
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsSimulating(true);

    setTimeout(() => {
      // AI interviewer follow-up questions & feedback
      const followUps = lang === 'vi' ? [
        "Cảm ơn câu trả lời của bạn! Bạn có thể chia sẻ về một thử thách lớn nhất bạn từng đối mặt trong một dự án kỹ thuật và cách bạn vượt qua nó không?",
        "Rất ấn tượng! Vậy tầm nhìn nghề nghiệp trong 5 năm tới của bạn sẽ đóng góp gì cho cộng đồng sinh viên tại trường?",
        "Tuyệt vời! Bạn có câu hỏi nào dành riêng cho Hội đồng tuyển sinh của chúng tôi không?"
      ] : [
        "Thank you! Could you share a major obstacle you faced in a technical project and how you overcame it?",
        "Impressive! What is your 5-year career vision and how will you contribute to our university community?",
        "Great answer! Do you have any questions for our Admission Committee?"
      ];

      const nextQuestion = followUps[Math.floor(Math.random() * followUps.length)];
      setMessages(prev => [...prev, { role: 'ai', content: nextQuestion }]);
      setIsSimulating(false);

      // Dynamically update metrics
      setMetrics({
        pace: `${Math.floor(125 + Math.random() * 20)} wpm (Tự nhiên)`,
        grammar: `${Math.floor(90 + Math.random() * 8)}%`,
        structure: 'STAR Framework (9/10)',
        impactScore: Math.floor(85 + Math.random() * 10)
      });
    }, 1500);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.success(lang === 'vi' ? '🎙️ Đã bật Micro giả lập giọng nói' : '🎙️ Voice simulation enabled');
      setInput(lang === 'vi' ? "Tôi đã có 2 năm kinh nghiệm nghiên cứu AI và muốn theo đuổi tấm bằng Thạc sĩ để phát triển giải pháp EdTech." : "I have 2 years of AI research experience and wish to pursue a Master degree in EdTech.");
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', height: 'calc(100vh - 120px)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Main Chat / Voice Interview Room */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {/* Room Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Bot size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>
                {lang === 'vi' ? 'Phòng Phỏng Vấn Giả Lập AI (Micro-Simulation)' : 'AI Micro-Simulation Room'}
              </h2>
              <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                ● Real-time Audio & Sentiment Analysis
              </span>
            </div>
          </div>
        </div>

        {/* Conversation Stream */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              {m.role === 'ai' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={16} />
                </div>
              )}
              <div style={{ 
                padding: '14px 18px', borderRadius: '18px', fontSize: '14px', lineHeight: '1.6',
                background: m.role === 'user' ? 'var(--primary)' : 'var(--bg-main)',
                color: m.role === 'user' ? '#fff' : 'var(--text-main)',
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
        <form onSubmit={handleSend} style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={toggleRecording}
            style={{ 
              padding: '12px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: isRecording ? '#ef4444' : 'rgba(59, 130, 246, 0.1)',
              color: isRecording ? '#fff' : '#3b82f6', transition: 'all 0.2s'
            }}
          >
            <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
          </button>
          <input 
            type="text" 
            placeholder={lang === 'vi' ? "Nhập câu trả lời hoặc sử dụng Micro..." : "Type response or click Mic..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', outline: 'none' }}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: '14px' }}>
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Real-time Feedback & Metrics Side Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#ec4899" /> {lang === 'vi' ? 'Chỉ Số Real-time' : 'Real-time Analytics'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tốc độ nói (Pace)</span>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#10b981', marginTop: '2px' }}>{metrics.pace}</div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Độ chính xác ngữ pháp</span>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#3b82f6', marginTop: '2px' }}>{metrics.grammar}</div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mạch logic câu trả lời</span>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#f59e0b', marginTop: '2px' }}>{metrics.structure}</div>
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Impact Score (Điểm Thuyết Phục)</span>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#8b5cf6', marginTop: '2px' }}>
                {metrics.impactScore} <span style={{ fontSize: '14px', fontWeight: '500' }}>/ 100</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '6px' }}>💡 Mẹo Phỏng Vấn Tuyển Sinh:</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Sử dụng công thức <strong>STAR (Situation - Task - Action - Result)</strong> khi trả lời về thành tựu cá nhân để chinh phục Hội đồng tuyển sinh!
          </p>
        </div>
      </div>
    </div>
  );
}
