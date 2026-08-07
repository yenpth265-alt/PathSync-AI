import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, Target, Book, Trophy, Globe, Compass, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiChat, createApplication } from '../services/api';
import toast from 'react-hot-toast';
import './PersonaLabPage.css';

const getCategories = (lang) => ({
  [lang === 'vi' ? 'Bản sắc & Mục tiêu' : 'Identity & Goals']: { icon: <Target size={16}/>, color: '#3b82f6' },
  [lang === 'vi' ? 'Hành trình học tập' : 'Academic Journey']: { icon: <Book size={16}/>, color: '#10b981' },
  [lang === 'vi' ? 'Thành tựu' : 'Achievements']: { icon: <Trophy size={16}/>, color: '#f59e0b' },
  [lang === 'vi' ? 'Cộng đồng' : 'Community']: { icon: <Globe size={16}/>, color: '#8b5cf6' },
  [lang === 'vi' ? 'Tầm nhìn tương lai' : 'Future Vision']: { icon: <Compass size={16}/>, color: '#ec4899' }
});

export default function PersonaLabPage({ lang = 'vi' }) {
  const [messages, setMessages] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const sendInitialGreeting = async () => {
      setLoading(true);
      try {
        const res = await aiChat([], {});
        setMessages([{
          role: 'ai',
          content: res.reply || (lang === 'vi' ? 'Hãy kể thêm cho mình nghe nhé.' : 'Tell me more about that.'),
          citations: res.citations,
          proposedActions: res.proposed_actions,
          safetyNotice: res.safety_notice
        }]);
        if (res.nodes) {
          setNodes(res.nodes);
        }
        if (res.suggestions) setSuggestions(res.suggestions);
      } catch {
        setMessages([{ role: 'ai', content: lang === 'vi' ? 'Rất tiếc, AI đang nghỉ ngơi một chút. Hãy thử lại sau nhé.' : 'Sorry, AI is resting. Please try again later.' }]);
      } finally {
        setLoading(false);
      }
    };

    sendInitialGreeting();
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (text, isInit = false) => {
    const userText = text || input;
    if (!userText && !isInit) return;
    
    if (!isInit) {
      setMessages(prev => [...prev, { role: 'user', content: userText }]);
      setInput('');
    }
    
    setLoading(true);
    try {
      const chatHistory = isInit ? [] : [...messages, { role: 'user', content: userText }];
      const res = await aiChat(chatHistory, {});
      
      setMessages(prev => [...prev, {
        role: 'ai',
        content: res.reply || (lang === 'vi' ? 'Hãy kể thêm cho mình nghe nhé.' : 'Tell me more about that.'),
        citations: res.citations,
        proposedActions: res.proposed_actions,
        safetyNotice: res.safety_notice
      }]);
      if (res.nodes) {
        setNodes(prev => {
          const newNodes = res.nodes.filter(n => !prev.find(p => p.id === n.id));
          return [...prev, ...newNodes];
        });
      }
      if (res.suggestions) setSuggestions(res.suggestions);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: lang === 'vi' ? 'Rất tiếc, AI đang nghỉ ngơi một chút. Hãy thử lại sau nhé.' : 'Sorry, AI is resting. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      if (action.type === 'save_program') {
        await createApplication({
          university: action.payload.university_name || 'Unknown',
          deadline: action.payload.deadline || 'Dec 31, 2026',
          type: 'Regular Decision'
        });
        toast.success(`Đã thêm ${action.payload.university_name} vào Kanban!`);
      } else if (action.type === 'create_roadmap') {
        toast.success('Đã lưu checklist lộ trình thành công!');
      } else {
        toast.success(`Đã xác nhận hành động: ${action.title}`);
      }
    } catch (e) {
      toast.error('Lỗi khi thực hiện hành động. Hãy kiểm tra Backend.');
    }
  };

  const CATEGORIES = getCategories(lang);
  const getNodesForCategory = (cat) => nodes.filter(n => n.category === cat || (!n.category && cat === (lang === 'vi' ? 'Bản sắc & Mục tiêu' : 'Identity & Goals')));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">{lang === 'vi' ? 'Cố vấn AI (Persona Lab)' : 'AI Mentor (Persona Lab)'} <span className="ai-badge">AI</span></h1>
          <p className="page-subtitle">{lang === 'vi' ? 'Trò chuyện để khám phá những điểm sáng (nodes) trong câu chuyện cá nhân của bạn, làm tư liệu viết luận.' : 'Chat to uncover the bright spots (nodes) in your personal story for your essays.'}</p>
        </div>
      </header>

      <div className="persona-page">
        {/* CHAT PANEL */}
        <div className="chat-panel">
          <div className="chat-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <Brain size={20} /> Mentor AI
            </h3>
          </div>
          
          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`message ${m.role}`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                {m.citations && m.citations.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Nguồn trích dẫn:</strong>
                    {m.citations.map((cit, idx) => (
                      <div key={idx}>
                        <a href={cit.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{cit.label}</a>
                        {cit.last_verified_at && <span style={{ marginLeft: '6px', fontSize: '10px' }}>(Đã xác minh: {new Date(cit.last_verified_at).toLocaleDateString()})</span>}
                      </div>
                    ))}
                  </div>
                )}
                {m.proposedActions && m.proposedActions.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {m.proposedActions.map((action, idx) => (
                      <div key={idx} style={{ padding: '8px 12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '4px' }}>{action.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{action.description}</div>
                        <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleAction(action)}>
                          {lang === 'vi' ? 'Xác nhận' : 'Confirm'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {m.safetyNotice && (
                  <div style={{ marginTop: '12px', fontSize: '11px', color: '#f59e0b', fontStyle: 'italic', display: 'flex', gap: '4px' }}>
                    <Compass size={12} style={{ marginTop: '2px' }} />
                    {m.safetyNotice}
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <div className="message ai">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  {lang === 'vi' ? 'Đang suy nghĩ...' : 'Thinking...'}
                </motion.div>
              </div>
            )}
          </div>

          <div className="chat-input-area">
            {suggestions.length > 0 && (
              <div className="quick-replies">
                {suggestions.map((s, i) => (
                  <button key={i} className="quick-reply-chip" onClick={() => handleSend(s)}>{s}</button>
                ))}
              </div>
            )}
            <div className="input-box" style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => {
                  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                  if (!SpeechRecognition) {
                    toast.error(lang === 'vi' ? 'Trình duyệt không hỗ trợ Web Speech API.' : 'Web Speech API not supported.');
                    return;
                  }
                  const rec = new SpeechRecognition();
                  rec.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
                  rec.onstart = () => toast.success('🎙️ Đang lắng nghe...');
                  rec.onresult = (e) => setInput(prev => (prev ? prev + ' ' + e.results[0][0].transcript : e.results[0][0].transcript));
                  rec.start();
                }}
                style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                title="Bật Micro nói"
              >
                🎙️
              </button>
              <input 
                type="text" 
                placeholder={lang === 'vi' ? "Nhập câu trả lời hoặc sử dụng Micro..." : "Type your answer or use Mic..."} 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={() => handleSend()} disabled={loading || !input.trim()}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* CANVAS PANEL */}
        <div className="canvas-panel">
          <div className="canvas-header">
            <h2 style={{ fontSize: '18px', color: 'var(--text-main)' }}>{lang === 'vi' ? 'Bản đồ Điểm sáng (Story Canvas)' : 'Story Canvas'}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{nodes.length} {lang === 'vi' ? 'Điểm sáng được trích xuất' : 'Nodes extracted'}</span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '13px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={async () => {
                  try {
                    await createApplication({
                      university: 'AI Persona Roadmap',
                      deadline: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                      type: 'Roadmap Tasks'
                    });
                    localStorage.setItem('ps_journey_roadmaps', JSON.stringify(nodes));
                    window.dispatchEvent(new Event('journeyUpdated'));
                    toast.success(lang === 'vi' ? '🚀 Đã đồng bộ lộ trình sang Bảng Kanban (Applications)!' : '🚀 Roadmap synced to Kanban!');
                  } catch (e) {
                    toast.error(lang === 'vi' ? 'Lỗi khi đẩy vào Kanban' : 'Failed to push to Kanban');
                  }
                }}
              >
                📌 Đẩy vào Bảng Lộ Trình (Kanban)
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            {Object.keys(CATEGORIES).map(cat => {
              const catNodes = getNodesForCategory(cat);
              if (catNodes.length === 0) return null;
              
              return (
                <div key={cat} className="category-section">
                  <div className="category-title">
                    {CATEGORIES[cat].icon} {cat}
                  </div>
                  <div className="node-grid">
                    <AnimatePresence>
                      {catNodes.map(node => (
                        <motion.div key={node.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="story-node" style={{ borderLeftColor: CATEGORIES[cat].color }}>
                          <>
                            <strong>{node.label || 'Điểm sáng'}</strong>
                            <p>{node.content || node.text}</p>
                          </>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
            
            {nodes.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '60px' }}>
                <Brain size={48} opacity={0.2} style={{ margin: '0 auto 16px' }} />
                <p>{lang === 'vi' ? 'Hãy bắt đầu trò chuyện để tìm ra những điểm sáng cho bài luận của bạn.' : 'Start chatting to uncover the bright spots for your essay.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
