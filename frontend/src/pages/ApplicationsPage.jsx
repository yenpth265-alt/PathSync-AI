import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, MessageSquare, History, Award, Save } from 'lucide-react';
import Header from '../components/Header';
import StatCards from '../components/StatCards';
import KanbanBoard from '../components/KanbanBoard';
import { getApplicationSOP, updateApplicationSOP, aiSOPAssist, aiEssayReview, getSOPHistory, saveSOPVersion } from '../services/api';
import toast from 'react-hot-toast';

export default function ApplicationsPage() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [sopContent, setSopContent] = useState('');
  const [sopPrompt, setSopPrompt] = useState('Why do you want to study at this university? (500 words)');
  const [saving, setSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [reviewScore, setReviewScore] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Version History states
  const [rightPanelTab, setRightPanelTab] = useState('ai'); // 'ai' | 'history'
  const [sopHistory, setSopHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadSOPHistory = async (appId) => {
    setLoadingHistory(true);
    try {
      const res = await getSOPHistory(appId);
      setSopHistory(res || []);
    } catch {
      console.error("Error loading SOP history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSOP = useCallback(async (id) => {
    try {
      const res = await getApplicationSOP(id);
      setSopContent(res.content || '');
      setSopPrompt(res.prompt || sopPrompt);
      loadSOPHistory(id);
    } catch (error) {
      console.error(error);
      setSopContent('');
    }
  }, [sopPrompt]);

  useEffect(() => {
    const handleOpen = (e) => {
      setSelectedApp(e.detail);
      loadSOP(e.detail.id);
    };
    window.addEventListener('openAppDetails', handleOpen);
    return () => window.removeEventListener('openAppDetails', handleOpen);
  }, [loadSOP]);

  const handleSaveSOP = async () => {
    if (!selectedApp) return;
    setSaving(true);
    try {
      await updateApplicationSOP(selectedApp.id, { content: sopContent, prompt: sopPrompt });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAIAssist = async () => {
    setLoadingAi(true);
    try {
      const res = await aiSOPAssist(sopPrompt, sopContent, 'suggest');
      setAiSuggestions(res.suggestion || "AI suggested some structural improvements.");
    } catch {
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
    } catch {
      setAiSuggestions("AI review is currently unavailable.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveNewVersion = async () => {
    if (!selectedApp) return;
    try {
      await saveSOPVersion({
        application_id: selectedApp.id,
        prompt: sopPrompt,
        content: sopContent,
        score: reviewScore || 0,
        ai_feedback: aiSuggestions || ""
      });
      toast.success("💾 Đã lưu thành công phiên bản mới!");
      loadSOPHistory(selectedApp.id);
    } catch {
      toast.error("Lỗi khi lưu phiên bản nháp");
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
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Đề bài / Câu hỏi bài luận (Essay Prompt)</label>
                  <input type="text" value={sopPrompt} onChange={e => setSopPrompt(e.target.value)} onBlur={handleSaveSOP} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }} />
                </div>
                
                <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Số từ: {wordCount}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={handleSaveNewVersion}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <Save size={13} /> Lưu Bản Nháp Mới
                    </button>
                    <span style={{ fontSize: '12px', color: saving ? 'var(--text-muted)' : 'var(--success)' }}>
                      {saving ? 'Đang lưu...' : <><CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Đã lưu tự động</>}
                    </span>
                  </div>
                </div>

                <textarea 
                  value={sopContent} 
                  onChange={e => setSopContent(e.target.value)} 
                  onBlur={handleSaveSOP}
                  placeholder="Bắt đầu viết bài luận của bạn tại đây..."
                  style={{ flex: 1, padding: '24px', border: 'none', resize: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '16px', lineHeight: 1.6 }}
                />
              </div>

              {/* Right side: AI Tools / Version History Tabs */}
              <div style={{ flex: 1, background: 'var(--card-bg)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                  <button 
                    onClick={() => setRightPanelTab('ai')}
                    style={{ flex: 1, padding: '14px', border: 'none', background: rightPanelTab === 'ai' ? 'transparent' : 'rgba(0,0,0,0.02)', borderBottom: rightPanelTab === 'ai' ? '2px solid var(--primary)' : 'none', color: rightPanelTab === 'ai' ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <MessageSquare size={14}/> Trợ Lý AI
                  </button>
                  <button 
                    onClick={() => setRightPanelTab('history')}
                    style={{ flex: 1, padding: '14px', border: 'none', background: rightPanelTab === 'history' ? 'transparent' : 'rgba(0,0,0,0.02)', borderBottom: rightPanelTab === 'history' ? '2px solid var(--primary)' : 'none', color: rightPanelTab === 'history' ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <History size={14}/> Lịch Sử Bản Nháp ({sopHistory.length})
                  </button>
                </div>
                
                {rightPanelTab === 'ai' ? (
                  <>
                    <div style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAIAssist} disabled={loadingAi}>
                        Xin Gợi Ý
                      </button>
                      <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleReview} disabled={loadingAi}>
                        Chấm Điểm
                      </button>
                    </div>

                    <div style={{ flex: 1, padding: '0 20px 20px', overflowY: 'auto' }}>
                      {loadingAi && <p style={{ color: 'var(--text-muted)' }}>AI đang phân tích...</p>}
                      
                      {reviewScore && !loadingAi && (
                        <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>Điểm số</div>
                          <div style={{ fontSize: '32px', color: '#10b981', fontWeight: 800 }}>{reviewScore}/100</div>
                        </div>
                      )}

                      {aiSuggestions && !loadingAi && (
                        <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main)' }}>
                          <h4 style={{ marginBottom: '12px', color: 'var(--primary)' }}>Nhận xét từ AI</h4>
                          {aiSuggestions}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loadingHistory && <p style={{ color: 'var(--text-muted)' }}>Đang tải lịch sử...</p>}
                    
                    {!loadingHistory && sopHistory.map((version) => (
                      <div 
                        key={version.id} 
                        style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>Bản Nháp #{version.version_number}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(version.created_at).toLocaleDateString()}</span>
                        </div>
                        {version.score > 0 && (
                          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Điểm số lưu vết: {version.score}/100</div>
                        )}
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {version.content}
                        </p>
                        <button 
                          onClick={() => {
                            setSopContent(version.content);
                            setSopPrompt(version.prompt);
                            if (version.score > 0) {
                              setReviewScore(version.score);
                            }
                            if (version.ai_feedback) {
                              setAiSuggestions(version.ai_feedback);
                            }
                            setRightPanelTab('ai');
                            toast.success(`Đã khôi phục Bản Nháp #${version.version_number}!`);
                          }}
                          className="btn btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '11px', alignSelf: 'flex-end' }}
                        >
                          Khôi Phục & Sửa Tiếp
                        </button>
                      </div>
                    ))}

                    {!loadingHistory && sopHistory.length === 0 && (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '20px' }}>Chưa có bản nháp nào được lưu vết.</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
