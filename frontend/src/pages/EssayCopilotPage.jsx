import React, { useState } from 'react';
import { Send, Bot, User, FileEdit } from 'lucide-react';
import './EssayCopilotPage.css';
import { reviewEssayAI } from '../services/api';

export default function EssayCopilotPage({ lang = 'vi' }) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: lang === 'vi' ? 'Chào bạn! Mình là Trợ lý Viết luận. Hãy dán bản nháp vào đây, mình sẽ giúp bạn rà soát và cải thiện nó nhé.' : 'Hello! I am your Essay Copilot. Paste your draft here, and I will help you review and improve it.' }
  ]);
  const [input, setInput] = useState('');
  const [essayContent, setEssayContent] = useState('My passion for computer science began when I was 12 years old...');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !essayContent.trim()) return;
    
    const userPrompt = input.trim() || (lang === 'vi' ? "Vui lòng nhận xét bản nháp bài luận hiện tại của tôi." : "Please review my current essay draft.");
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setInput('');
    
    try {
      const res = await reviewEssayAI(essayContent, userPrompt);
      setMessages(prev => [...prev, { role: 'ai', content: res.feedback || (lang === 'vi' ? "Bài viết khá tốt! Hãy tiếp tục tinh chỉnh cấu trúc và giọng văn nhé." : "Good essay! Keep refining the structure and tone.") }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: lang === 'vi' ? "Rất tiếc, đã có lỗi xảy ra khi chấm bài. Vui lòng thử lại sau." : "Sorry, an error occurred while reviewing. Please try again later." }]);
    }
  };

  return (
    <div className="essay-copilot-page">
      <div className="editor-section">
        <div className="section-header">
          <FileEdit size={18} />
          <h3>{lang === 'vi' ? 'Bản nháp Bài luận' : 'Essay Draft'}</h3>
        </div>
        <textarea 
          className="essay-editor" 
          value={essayContent} 
          onChange={(e) => setEssayContent(e.target.value)}
          placeholder={lang === 'vi' ? "Bắt đầu viết bài luận của bạn tại đây..." : "Start writing your essay here..."}
        ></textarea>
      </div>
      
      <div className="chat-section">
        <div className="section-header">
          <Bot size={18} color="var(--primary)" />
          <h3>{lang === 'vi' ? 'Trợ lý AI' : 'AI Copilot'}</h3>
        </div>
        
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble-wrapper ${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`chat-bubble ${msg.role}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        
        <form className="chat-input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder={lang === 'vi' ? "Yêu cầu AI nhận xét bài luận..." : "Ask AI to review your essay..."} 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-send"><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
}
