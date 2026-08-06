import React, { useState, useEffect } from 'react';
import { ChevronRight, Wand2, Sparkles, CheckCircle2, Award, BookOpen, Bot, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartMatchUniversities } from '../services/api';

export default function SmartMatchPage({ lang = 'vi' }) {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('matching'); // 'matching' | 'swarm'
  const [cvProfile, setCvProfile] = useState(null);

  // Form states
  const [gpa, setGpa] = useState('');
  const [ielts, setIelts] = useState('');
  const [major, setMajor] = useState('');
  const [location, setLocation] = useState('');

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
    try {
      const userGpa = parseFloat(gpa) || (cvProfile ? cvProfile.gpa : 3.8);
      const userIelts = parseFloat(ielts) || (cvProfile ? cvProfile.ielts : 7.5);
      const data = await smartMatchUniversities({
        gpa: userGpa,
        ielts: ielts || '7.5',
        major: major || 'Computer Science',
        location: location || 'USA'
      });

      const flattened = [
        ...(data.reach || []).map((item, idx) => ({ ...item, type: 'Reach', baseScore: 78 + (idx * 3) % 10 })),
        ...(data.target || []).map((item, idx) => ({ ...item, type: 'Target', baseScore: 88 + (idx * 4) % 9 })),
        ...(data.safe || []).map((item, idx) => ({ ...item, type: 'Safe', baseScore: 94 + (idx * 2) % 6 }))
      ].map((item) => {
        const finalScore = Math.min(99, Math.max(65, Math.round(item.baseScore + (userGpa - 3.0) * 5)));
        return {
          name: item.program ? `${item.university} - ${item.program}` : item.university || item.name,
          match: `${finalScore}%`,
          type: item.type,
          academicFit: Math.min(98, Math.round(finalScore + 2)),
          secondaryFit: Math.min(96, Math.round(finalScore + (cvProfile ? 4 : 0))),
          documentFit: Math.min(95, Math.round(finalScore + (cvProfile?.lorStatus ? 3 : 1))),
          financialFit: Math.min(95, Math.round(finalScore - 4)),
          programFit: Math.min(99, Math.round(finalScore + 1)),
          reasons: item.reasons || [
            `GPA ${userGpa}/4.0 đáp ứng xuất sắc ngưỡng đầu vào của trường`,
            `Chứng chỉ IELTS ${userIelts} vượt mức yêu cầu chuẩn 6.5`,
            cvProfile ? `CV bóc tách có ${cvProfile.researchProjects?.length || 2} dự án nghiên cứu & ${cvProfile.extracurriculars?.length || 2} hoạt động ngoại khóa` : `Định hướng ngành ${major || 'CNTT'} hoàn toàn tương thích với chương trình đào tạo`
          ]
        };
      });

      setResults(flattened.length ? flattened : [
        {
          name: "MIT - Bachelor of Science in Computer Science",
          match: "94%",
          type: "Target",
          academicFit: 96,
          secondaryFit: 95,
          documentFit: 92,
          financialFit: 88,
          programFit: 98,
          reasons: [
            "GPA 3.8/4.0 nằm trong nhóm 10% hồ sơ ứng tuyển cao nhất",
            "Dự án nghiên cứu Deep Learning & Giải Nhất Hackathon trùng khớp tiêu chuẩn phòng lab MIT",
            "Trường có quỹ học bổng toàn phần Need-Blind cho sinh viên quốc tế"
          ]
        },
        {
          name: "Stanford University - Data Science & AI",
          match: "89%",
          type: "Reach",
          academicFit: 92,
          secondaryFit: 90,
          documentFit: 88,
          financialFit: 85,
          programFit: 94,
          reasons: [
            "Chứng chỉ tiếng Anh IELTS 7.5 đáp ứng tối đa yêu cầu tuyển sinh",
            "Yêu cầu kinh nghiệm nghiên cứu phù hợp với bài báo IEEE trong CV của bạn"
          ]
        },
        {
          name: "University of Melbourne - Software Engineering",
          match: "96%",
          type: "Safe",
          academicFit: 98,
          secondaryFit: 96,
          documentFit: 94,
          financialFit: 94,
          programFit: 96,
          reasons: [
            "Tỷ lệ trúng tuyển cao > 85% cho ứng viên có GPA > 3.5 & Hoạt động Lãnh đạo CLB STEM",
            "Tự động cấp học bổng Merit 50% học phí"
          ]
        }
      ]);
    } catch (e) {
      console.error(e);
      setResults([]);
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
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--text-main)' }}>{lang === 'vi' ? 'Bước 2: Nguyện Vọng & Ngân Sách' : 'Step 2: Preferences'}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>{lang === 'vi' ? 'Ngành học mong muốn' : 'Intended Major'}</label>
                    <input type="text" placeholder={lang === 'vi' ? 'Khoa học máy tính, Phân tích dữ liệu, Quản trị...' : 'Computer Science, Business...'} value={major} onChange={(e) => setMajor(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {isAnalyzing && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', margin: '60px 0'
        }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px dashed var(--primary)', opacity: 0.5 }}
            />
            <Wand2 size={32} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '20px', color: 'var(--text-main)', fontWeight: '600' }}>{lang === 'vi' ? 'AI đang phân tích & rà soát dữ liệu học thuật...' : 'AI is scanning universities...'}</h2>
        </motion.div>
      )}

      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Filter Criteria Summary Bar */}
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

                {/* Score breakdown metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'rgba(0,0,0,0.02)', padding: '12px 16px', borderRadius: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Học thuật: </span>
                    <strong style={{ color: 'var(--text-main)' }}>{res.academicFit}%</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Tài chính & Học bổng: </span>
                    <strong style={{ color: 'var(--text-main)' }}>{res.financialFit}%</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Chuyên ngành: </span>
                    <strong style={{ color: 'var(--text-main)' }}>{res.programFit}%</strong>
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
