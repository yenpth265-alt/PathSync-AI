import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, Target, Book, Trophy, Globe, Compass, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiChat } from '../services/api';
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
    // Initial greeting
    handleSend('', true);
  }, []);

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
      
      setMessages(prev => [...prev, { role: 'ai', content: res.reply || (lang === 'vi' ? 'Hãy kể thêm cho mình nghe nhé.' : 'Tell me more about that.') }]);
      if (res.nodes) {
        setNodes(prev => {
          const newNodes = res.nodes.filter(n => !prev.find(p => p.id === n.id));
          return [...prev, ...newNodes];
        });
      }
      if (res.suggestions) setSuggestions(res.suggestions);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: lang === 'vi' ? 'Rất tiếc, AI đang nghỉ ngơi một chút. Hãy thử lại sau nhé.' : 'Sorry, AI is resting. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = getCategories(lang);
  const groupedNodes = CATEGORIES; // Just layout categories
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
                {m.content}
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
            <div className="input-box">
              <input 
                type="text" 
                placeholder={lang === 'vi' ? "Nhập câu trả lời của bạn..." : "Type your answer..."} 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
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
              {nodes.length >= 5 && (
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  {lang === 'vi' ? 'Bắt đầu Viết' : 'Start Writing'} <ArrowRight size={14} />
                </button>
              )}
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
                          {node.text}
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
