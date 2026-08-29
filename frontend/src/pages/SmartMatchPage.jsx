import React, { useState, useEffect } from 'react';
import { ChevronRight, Wand2, Sparkles, CheckCircle2, Award, BookOpen, Bot, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartMatchUniversities } from '../services/api';
import { ACADEMIC_FIELDS } from '../data/academicFields';

export default function SmartMatchPage({ lang = 'vi' }) {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('matching'); // 'matching' | 'swarm'
  const [cvProfile, setCvProfile] = useState(null);

  // Form states
  const [gpa, setGpa] = useState('');
  const [ielts, setIelts] = useState('');
  const [major, setMajor] = useState(ACADEMIC_FIELDS[0].id);
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCVProfile = () => {
      try {
        const saved = localStorage.getItem('ps_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCvProfile(parsed);
          if (parsed.gpa) setGpa(parsed.gpa.toString());
          if (parsed.ielts) setIelts(parsed.ielts.toString());
          if (parsed.major) setMajor(parsed.major);
        }
      } catch (e) {
        console.error("Failed to load CV profile", e);
      }
    };

    loadCVProfile();
    window.addEventListener('userProfileUpdated', loadCVProfile);
    return () => window.removeEventListener('userProfileUpdated', loadCVProfile);
  }, []);

  const handleNext = () => setStep(step + 1);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalyzingStep(0);
    setError('');
    try {
      const userGpa = parseFloat(gpa) || (cvProfile ? cvProfile.gpa : 3.8);
      const userIelts = parseFloat(ielts) || (cvProfile ? cvProfile.ielts : 7.5);
      
      // Simulate Swarm Agents processing sequentially
      for (let i = 1; i <= 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalyzingStep(i);
      }

      const data = await smartMatchUniversities({
        gpa: userGpa,
        ielts: ielts || '7.5',
        major,
        location: location || 'USA'
      });

      const combined = [
        ...(data.reach || []).map((item) => ({ ...item, type: 'Reach' })),
        ...(data.target || []).map((item) => ({ ...item, type: 'Target' })),
        ...(data.safe || []).map((item) => ({ ...item, type: 'Safe' }))
      ];

      // The AI can occasionally place the same program in more than one tier.
      // Keep the first (highest-tier) occurrence rather than showing it twice
      // with two different scores for the same program.
      const seen = new Set();
      const deduped = combined.filter((item) => {
        const key = `${item.university || ''}|${item.program || item.name || ''}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const flattened = deduped.map((item) => ({
        name: item.program ? `${item.university} - ${item.program}` : item.university || item.name,
        match: `${Math.round(item.score ?? 0)}%`,
        type: item.type,
        reasons: item.reasons && item.reasons.length > 0 ? item.reasons : [
          `GPA ${userGpa}/4.0 so với yêu cầu của chương trình`,
          `Chứng chỉ IELTS ${userIelts} so với yêu cầu tối thiểu`
        ]
      }));

      setResults(flattened);
      if (!flattened.length) {
        setError(lang === 'vi'
          ? 'Chưa có chương trình nào trong kho dữ liệu khớp với lựa chọn này. Hãy thử ngành hoặc khu vực khác.'
          : 'No programs in the synced dataset match this selection yet. Try another field or region.');
      }
    } catch (e) {
      console.error(e);
      setResults([]);
      setError(lang === 'vi'
        ? `Không gọi được dịch vụ AI: ${e.message}`
        : `Could not reach the AI service: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', paddingTop: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Smart Match AI</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '600px' }}>
          {lang === 'vi' ? 'Thuật toán AI phân tích hồ sơ dựa trên GPA, IELTS, ngân sách và định hướng chuyên ngành để đề xuất trường chuẩn xác nhất.' : 'Let our AI analyze your profile and find the best matching universities tailored for you.'}
        </p>
      </div>

      {!results && !isAnalyzing && (
        <div style={{ 
          background: 'var(--card-bg)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-color)', borderRadius: '24px',
          padding: '40px', width: '100%', maxWidth: '600px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* A single motion.div keyed on `step` (see OnboardingPage.jsx for
              the same fix and why): two independent conditionally-rendered
              motion.divs as AnimatePresence's direct children left step 2
              permanently unrendered — the button click advanced `step`, but
              the content stayed frozen on step 1. */}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {step === 1 && (
              <>
                <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--text-main)' }}>{lang === 'vi' ? 'Bước 1: Hồ sơ Học thuật & Năng lực' : 'Step 1: Academic Profile'}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>{lang === 'vi' ? 'Điểm GPA Trung Bình (Thang 4.0)' : 'GPA (4.0 Scale)'}</label>
                    <input type="number" step="0.1" placeholder="Ví dụ: 3.8" value={gpa} onChange={(e) => setGpa(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>{lang === 'vi' ? 'Chứng chỉ Ngoại ngữ (IELTS / TOEFL)' : 'IELTS / TOEFL Score'}</label>
                    <input type="text" placeholder="Ví dụ: IELTS 7.5" value={ielts} onChange={(e) => setIelts(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: '16px', justifyContent: 'center' }} onClick={handleNext}>
                    {lang === 'vi' ? 'Tiếp theo' : 'Next'} <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--text-main)' }}>{lang === 'vi' ? 'Bước 2: Nguyện Vọng & Ngân Sách' : 'Step 2: Preferences'}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>{lang === 'vi' ? 'Chuyên ngành dự định' : 'Intended Major'}</label>
                    <select value={major} onChange={(e) => setMajor(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }}>
                      {ACADEMIC_FIELDS.map((field) => (
                        <option key={field.id} value={field.id}>{lang === 'vi' ? field.vi : field.en}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>{lang === 'vi' ? 'Quốc gia / Khu vực ưu tiên' : 'Desired Location'}</label>
                    <input type="text" placeholder={lang === 'vi' ? 'Mỹ, Châu Âu, Úc, Singapore...' : 'US, Europe, Australia...'} value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(1)}>{lang === 'vi' ? 'Quay lại' : 'Back'}</button>
                    <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)' }} onClick={handleAnalyze}>
                      <Wand2 size={16} /> {lang === 'vi' ? 'Phân tích Độ phù hợp AI' : 'Analyze Match'}
                    </button>
                  </div>
                </div>
              </>
            )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {isAnalyzing && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', margin: '40px 0', width: '100%', maxWidth: '800px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '6px 16px', borderRadius: '24px', fontWeight: '700', marginBottom: '12px' }}>
              <Bot size={18} /> Multi-Agent Swarm Đang Xử Lý
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-main)' }}>Khởi chạy hệ thống 5 AI Agents...</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', width: '100%' }}>
            {[
              { name: 'Data Crawler Agent', role: 'Quét 21+ hệ thống tuyển sinh', color: '#3b82f6', step: 1 },
              { name: 'Matching Analyst Agent', role: 'Đối chiếu chỉ tiêu học thuật', color: '#f59e0b', step: 2 },
              { name: 'Financial Agent', role: 'Tối ưu ngân sách & Học bổng', color: '#10b981', step: 3 },
              { name: 'Document Agent', role: 'Đánh giá hoạt động ngoại khóa & CV', color: '#ec4899', step: 4 },
              { name: 'Chief Orchestrator Agent', role: 'Tổng hợp & Ra quyết định', step: 5, color: '#8b5cf6' }
            ].map((agent, idx) => (
              <motion.div key={idx} 
                initial={{ opacity: 0.5, y: 10 }} 
                animate={{ opacity: analyzingStep >= agent.step ? 1 : 0.4, y: 0 }}
                style={{
                  background: analyzingStep >= agent.step ? `${agent.color}15` : 'var(--card-bg)',
                  border: `1px solid ${analyzingStep >= agent.step ? agent.color : 'var(--border-color)'}`,
                  padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px',
                  transition: 'all 0.4s ease'
                }}
              >
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '10px', 
                  background: analyzingStep >= agent.step ? agent.color : 'var(--bg-color)', 
                  color: analyzingStep >= agent.step ? '#fff' : 'var(--text-muted)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  {analyzingStep > agent.step ? <CheckCircle2 size={20} /> : <Activity size={20} className={analyzingStep === agent.step ? "animate-pulse" : ""} />}
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: analyzingStep >= agent.step ? 'var(--text-main)' : 'var(--text-muted)' }}>{agent.name}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{agent.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <h2 style={{ fontSize: '20px', color: 'var(--text-main)', fontWeight: '600' }}>{lang === 'vi' ? 'AI đang đối chiếu hồ sơ với dữ liệu chương trình...' : 'AI is matching your profile against program data...'}</h2>
        </motion.div>
      )}

      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TỔNG QUAN TIÊU CHÍ ĐANG LỌC</span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>🎓 GPA: <strong>{gpa || '3.8/4.0'}</strong></span>
                <span>📜 Ngoại ngữ: <strong>{ielts || 'IELTS 7.5'}</strong></span>
                <span>💻 Ngành: <strong>{major || 'CNTT'}</strong></span>
                <span>📍 Khu vực: <strong>{location || 'Mỹ'}</strong></span>
              </div>
            </div>
            <button className="btn btn-outline" style={{ fontSize: '13px' }} onClick={() => { setResults(null); setStep(1); }}>
              ⚙️ Đổi Tiêu Chí
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-main)' }}>{lang === 'vi' ? 'Top Trường Đại Học Phù Hợp Nhất' : 'Best Match Results'}</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sắp xếp theo độ tương thích giảm dần</span>
          </div>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            {error && (
              <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                {error}
              </div>
            )}
            {results.map((res, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.15 }} style={{
                background: 'var(--card-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-md)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', 
                        background: res.type === 'Reach' ? '#fee2e2' : res.type === 'Target' ? '#e0f2fe' : '#dcfce7',
                        color: res.type === 'Reach' ? '#ef4444' : res.type === 'Target' ? '#0ea5e9' : '#22c55e'
                      }}>{res.type === 'Reach' ? (lang === 'vi' ? '🔥 Nhóm Thử Thách (Reach)' : 'Reach') : res.type === 'Target' ? (lang === 'vi' ? '🎯 Nhóm Mục Tiêu (Target)' : 'Target') : (lang === 'vi' ? '🛡️ Nhóm An Toàn (Safe)' : 'Safe')}</span>
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>{res.name}</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{res.match}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{lang === 'vi' ? 'Độ tương thích tổng thể' : 'Compatibility'}</div>
                  </div>
                </div>

                {/* Reasons list */}
                {res.reasons && res.reasons.length > 0 && (
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>LÝ DO PHÙ HỢP:</span>
                    <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {res.reasons.map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
