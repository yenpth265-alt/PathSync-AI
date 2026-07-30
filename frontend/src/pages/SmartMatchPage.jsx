import React, { useState } from 'react';
import { Target, Search, CheckCircle2, ChevronRight, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartMatchUniversities } from '../services/api';

export default function SmartMatchPage() {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  // Form states
  const [gpa, setGpa] = useState('');
  const [ielts, setIelts] = useState('');
  const [major, setMajor] = useState('');
  const [location, setLocation] = useState('');

  const handleNext = () => setStep(step + 1);
  
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const data = await smartMatchUniversities({
        gpa: parseFloat(gpa) || 3.8,
        ielts: ielts || 'IELTS 7.5',
        major: major || 'Computer Science',
        location: location || ''
      });
      setResults(data || []);
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
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '500px' }}>
          Để AI của chúng mình phân tích hồ sơ và tìm ra những ngôi trường phù hợp nhất dành riêng cho bạn.
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
                <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--text-main)' }}>Bước 1: Hồ sơ Học thuật</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>GPA (Hệ 4.0)</label>
                    <input type="number" step="0.1" placeholder="3.8" value={gpa} onChange={(e) => setGpa(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Điểm IELTS / TOEFL</label>
                    <input type="text" placeholder="IELTS 7.5" value={ielts} onChange={(e) => setIelts(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: '16px', justifyContent: 'center' }} onClick={handleNext}>
                    Tiếp theo <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--text-main)' }}>Bước 2: Nguyện vọng</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Chuyên ngành dự định</label>
                    <input type="text" placeholder="Khoa học máy tính, Kinh doanh..." value={major} onChange={(e) => setMajor(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Khu vực mong muốn</label>
                    <input type="text" placeholder="Mỹ, Châu Âu, Úc..." value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(1)}>Quay lại</button>
                    <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)' }} onClick={handleAnalyze}>
                      <Wand2 size={16} /> Phân tích Độ phù hợp
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
          <h2 style={{ fontSize: '20px', color: 'var(--text-main)', fontWeight: '600' }}>AI đang rà soát hơn 4,200 trường...</h2>
        </motion.div>
      )}

      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>Kết quả Phù hợp nhất</h2>
            <button className="btn btn-outline" onClick={() => { setResults(null); setStep(1); }}>Làm lại</button>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {results.map((res, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.2 }} style={{
                background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', 
                      background: res.type === 'Reach' ? '#fee2e2' : res.type === 'Target' ? '#e0f2fe' : '#dcfce7',
                      color: res.type === 'Reach' ? '#ef4444' : res.type === 'Target' ? '#0ea5e9' : '#22c55e'
                    }}>{res.type === 'Reach' ? 'Thử Thách' : res.type === 'Target' ? 'Phù Hợp' : 'An Toàn'}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>{res.name}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>{res.match}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Độ tương thích</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
