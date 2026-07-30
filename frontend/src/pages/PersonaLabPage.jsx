import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, Target, Book, Trophy, Globe, Compass, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiChat } from '../services/api';
import './PersonaLabPage.css';

const CATEGORIES = {
  'Bản sắc & Mục tiêu': { icon: <Target size={16}/>, color: '#3b82f6' },
  'Hành trình học tập': { icon: <Book size={16}/>, color: '#10b981' },
  'Thành tựu': { icon: <Trophy size={16}/>, color: '#f59e0b' },
  'Cộng đồng': { icon: <Globe size={16}/>, color: '#8b5cf6' },
  'Tầm nhìn tương lai': { icon: <Compass size={16}/>, color: '#ec4899' }
};

export default function PersonaLabPage() {
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
      
      setMessages(prev => [...prev, { role: 'ai', content: res.reply || 'Hãy kể thêm cho mình nghe nhé.' }]);
      if (res.nodes) {
        setNodes(prev => {
          const newNodes = res.nodes.filter(n => !prev.find(p => p.id === n.id));
          return [...prev, ...newNodes];
        });
      }
      if (res.suggestions) setSuggestions(res.suggestions);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Rất tiếc, AI đang nghỉ ngơi một chút. Hãy thử lại sau nhé.' }]);
    } finally {
      setLoading(false);
    }
  };

  const groupedNodes = CATEGORIES; // Just layout categories
  const getNodesForCategory = (cat) => nodes.filter(n => n.category === cat || (!n.category && cat === 'Bản sắc & Mục tiêu'));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">Cố vấn AI (Persona Lab) <span className="ai-badge">AI</span></h1>
          <p className="page-subtitle">Trò chuyện để khám phá những điểm sáng (nodes) trong câu chuyện cá nhân của bạn, làm tư liệu viết luận.</p>
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
                  Đang suy nghĩ...
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
                placeholder="Nhập câu trả lời của bạn..." 
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
            <h2 style={{ fontSize: '18px', color: 'var(--text-main)' }}>Bản đồ Điểm sáng (Story Canvas)</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{nodes.length} Điểm sáng được trích xuất</span>
              {nodes.length >= 5 && (
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  Bắt đầu Viết <ArrowRight size={14} />
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
                <p>Hãy bắt đầu trò chuyện để tìm ra những điểm sáng cho bài luận của bạn.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
