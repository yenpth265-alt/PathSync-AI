import React, { useState, useEffect } from 'react';
import { X, Save, FileText, CheckCircle2, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import StatCards from '../components/StatCards';
import KanbanBoard from '../components/KanbanBoard';
import { getApplicationSOP, updateApplicationSOP, aiSOPAssist, aiEssayReview } from '../services/api';

export default function ApplicationsPage() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [sopContent, setSopContent] = useState('');
  const [sopPrompt, setSopPrompt] = useState('Why do you want to study at this university? (500 words)');
  const [saving, setSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [reviewScore, setReviewScore] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const handleOpen = (e) => {
      setSelectedApp(e.detail);
      loadSOP(e.detail.id);
    };
    window.addEventListener('openAppDetails', handleOpen);
    return () => window.removeEventListener('openAppDetails', handleOpen);
  }, []);

  const loadSOP = async (id) => {
    try {
      const res = await getApplicationSOP(id);
      if (res && res.data) {
        setSopContent(res.data.content || '');
        setSopPrompt(res.data.prompt || sopPrompt);
      }
    } catch (e) {
      console.error(e);
      setSopContent('');
    }
  };

  const handleSaveSOP = async () => {
    if (!selectedApp) return;
    setSaving(true);
    try {
      await updateApplicationSOP(selectedApp.id, { content: sopContent, prompt: sopPrompt });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAIAssist = async () => {
    setLoadingAi(true);
    try {
      const res = await aiSOPAssist(sopPrompt, sopContent, 'suggest');
      setAiSuggestions(res.suggestions || "AI suggested some structural improvements.");
    } catch (e) {
      setAiSuggestions("AI is currently unavailable.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleReview = async () => {
    setLoadingAi(true);
    try {
      const res = await aiEssayReview(sopContent, sopPrompt);
      setReviewScore(res.score || 85);
      setAiSuggestions(res.feedback || "Good effort, but needs more specific examples.");
    } catch (e) {
      setAiSuggestions("AI review is currently unavailable.");
    } finally {
      setLoadingAi(false);
    }
  };

  const wordCount = sopContent.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <>
      <Header />
      <StatCards />
      <KanbanBoard />

      {selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ background: 'var(--bg-color)', width: '100%', maxWidth: '1000px', height: '100%', maxHeight: '800px', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-premium)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)' }}>
              <div>
                <h2 style={{ fontSize: '24px', color: 'var(--text-main)', marginBottom: '4px' }}>{selectedApp.university}</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedApp.type}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', background: 'var(--primary)', color: 'white' }}>{selectedApp.column.toUpperCase()}</span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => { setSelectedApp(null); setAiSuggestions(null); setReviewScore(null); }}><X /></button>
            </div>

            {/* SOP Editor Layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* Left side: Editor */}
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Essay Prompt</label>
                  <input type="text" value={sopPrompt} onChange={e => setSopPrompt(e.target.value)} onBlur={handleSaveSOP} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }} />
                </div>
                
                <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.05)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Word count: {wordCount}</span>
                  <span style={{ fontSize: '12px', color: saving ? 'var(--text-muted)' : 'var(--success)' }}>
                    {saving ? 'Saving...' : <><CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Saved</>}
                  </span>
                </div>

                <textarea 
                  value={sopContent} 
                  onChange={e => setSopContent(e.target.value)} 
                  onBlur={handleSaveSOP}
                  placeholder="Start writing your statement of purpose here..."
                  style={{ flex: 1, padding: '24px', border: 'none', resize: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '16px', lineHeight: 1.6 }}
                />
              </div>

              {/* Right side: AI Tools */}
              <div style={{ flex: 1, background: 'var(--card-bg)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={16}/> AI Assistant</h3>
                </div>
                
                <div style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAIAssist} disabled={loadingAi}>
                    Get Ideas
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleReview} disabled={loadingAi}>
                    Review Essay
                  </button>
                </div>

                <div style={{ flex: 1, padding: '0 20px 20px', overflowY: 'auto' }}>
                  {loadingAi && <p style={{ color: 'var(--text-muted)' }}>AI is analyzing...</p>}
                  
                  {reviewScore && !loadingAi && (
                    <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>Score</div>
                      <div style={{ fontSize: '32px', color: '#10b981', fontWeight: 800 }}>{reviewScore}/100</div>
                    </div>
                  )}

                  {aiSuggestions && !loadingAi && (
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main)' }}>
                      <h4 style={{ marginBottom: '12px', color: 'var(--primary)' }}>AI Feedback</h4>
                      {aiSuggestions}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
