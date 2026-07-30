import React, { useState } from 'react';
import { Send, Bot, User, FileEdit } from 'lucide-react';
import './EssayCopilotPage.css';
import { reviewEssayAI } from '../services/api';

export default function EssayCopilotPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Chào bạn! Mình là Trợ lý Viết luận. Hãy dán bản nháp vào đây, mình sẽ giúp bạn rà soát và cải thiện nó nhé.' }
  ]);
  const [input, setInput] = useState('');
  const [essayContent, setEssayContent] = useState('My passion for computer science began when I was 12 years old...');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !essayContent.trim()) return;
    
    const userPrompt = input.trim() || "Vui lòng nhận xét bản nháp bài luận hiện tại của tôi.";
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setInput('');
    
    try {
      const res = await reviewEssayAI(essayContent, userPrompt);
      setMessages(prev => [...prev, { role: 'ai', content: res.feedback || "Bài viết khá tốt! Hãy tiếp tục tinh chỉnh cấu trúc và giọng văn nhé." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: "Rất tiếc, đã có lỗi xảy ra khi chấm bài. Vui lòng thử lại sau." }]);
    }
  };

  return (
    <div className="essay-copilot-page">
      <div className="editor-section">
        <div className="section-header">
          <FileEdit size={18} />
          <h3>Bản nháp Bài luận</h3>
        </div>
        <textarea 
          className="essay-editor" 
          value={essayContent} 
          onChange={(e) => setEssayContent(e.target.value)}
          placeholder="Bắt đầu viết bài luận của bạn tại đây..."
        ></textarea>
      </div>
      
      <div className="chat-section">
        <div className="section-header">
          <Bot size={18} color="var(--primary)" />
          <h3>Trợ lý AI</h3>
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
            placeholder="Yêu cầu AI nhận xét bài luận..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-send"><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
}
