import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, GraduationCap, Briefcase, Globe, Target, Compass, Send } from 'lucide-react';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './OnboardingPage.css';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateProfileState, refreshProfile, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    education_level: '',
    target_degree: '',
    fields: [],
    regions: [],
    intake_year: '2025',
    term: 'Fall',
    budget: '',
    journey_type: ''
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSelect = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key, value) => {
    setFormData(prev => {
      const arr = prev[key];
      if (arr.includes(value)) return { ...prev, [key]: arr.filter(i => i !== value) };
      return { ...prev, [key]: [...arr, value] };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateProfile({ ...formData, onboarding_done: true });
      await refreshProfile();
      if (formData.journey_type === 'Exploring') navigate('/explore');
      else navigate('/dashboard');
    } catch (err) {
      updateProfileState({ ...formData, onboarding_done: true });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="step-indicators" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', flex: 1, marginRight: '24px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`step-dot ${i <= step ? 'active' : ''}`} />
              ))}
            </div>
            <button 
              className="btn btn-outline" 
              style={{ padding: '6px 12px', fontSize: '13px' }}
              onClick={() => { logout(); navigate('/'); }}
            >
              Thoát
            </button>
          </div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)', marginBottom: '8px' }}>
            {step === 1 && "Chào mừng bạn! Hãy bắt đầu nào"}
            {step === 2 && "Bạn quan tâm đến lĩnh vực nào?"}
            {step === 3 && "Kế hoạch & Ngân sách"}
            {step === 4 && "Chọn hướng đi của bạn"}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {step === 1 && "Hãy cho chúng mình biết một chút về tình trạng học vấn hiện tại của bạn."}
            {step === 2 && "Chọn các ngành học và khu vực bạn muốn đi du học."}
            {step === 3 && "Bạn dự định đi du học năm nào và ngân sách khoảng bao nhiêu?"}
            {step === 4 && "PathSync có thể giúp bạn tốt nhất theo cách nào hôm nay?"}
          </p>
        </div>

        <div className="onboarding-content">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 style={{ marginBottom: '16px' }}>Trình độ học vấn hiện tại</h3>
                <div className="options-grid" style={{ marginBottom: '32px' }}>
                  {['Học sinh cấp 3', 'Sinh viên đại học', 'Đã tốt nghiệp', 'Đang đi làm'].map(lvl => (
                    <div key={lvl} className={`option-card ${formData.education_level === lvl ? 'selected' : ''}`} onClick={() => handleSelect('education_level', lvl)}>
                      <div className="option-icon"><GraduationCap /></div>
                      <span style={{ fontWeight: 500 }}>{lvl}</span>
                    </div>
                  ))}
                </div>
                
                <h3 style={{ marginBottom: '16px' }}>Bằng cấp mục tiêu</h3>
                <div className="options-grid">
                  {['Cử nhân (Bachelor)', 'Thạc sĩ (Master)', 'MBA', 'Tiến sĩ (PhD)'].map(deg => (
                    <div key={deg} className={`option-card ${formData.target_degree === deg ? 'selected' : ''}`} onClick={() => handleSelect('target_degree', deg)}>
                      <div className="option-icon"><Briefcase /></div>
                      <span style={{ fontWeight: 500 }}>{deg}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 style={{ marginBottom: '16px' }}>Lĩnh vực quan tâm (Tối đa 3)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
                  {['CS/IT', 'Kinh doanh', 'Tài chính', 'Kỹ thuật', 'Data Science', 'Thiết kế', 'Y tế', 'Khác'].map(field => (
                    <button 
                      key={field}
                      onClick={() => toggleArrayItem('fields', field)}
                      style={{
                        padding: '10px 20px', borderRadius: '20px', border: '1px solid var(--border-color)',
                        background: formData.fields.includes(field) ? 'var(--primary)' : 'transparent',
                        color: formData.fields.includes(field) ? 'white' : 'var(--text-main)',
                        cursor: 'pointer'
                      }}
                    >{field}</button>
                  ))}
                </div>

                <h3 style={{ marginBottom: '16px' }}>Khu vực ưu tiên</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {['Bắc Mỹ', 'Tây Âu', 'Đông Á', 'Đông Nam Á', 'Châu Úc'].map(region => (
                    <button 
                      key={region}
                      onClick={() => toggleArrayItem('regions', region)}
                      style={{
                        padding: '10px 20px', borderRadius: '20px', border: '1px solid var(--border-color)',
                        background: formData.regions.includes(region) ? 'var(--primary)' : 'transparent',
                        color: formData.regions.includes(region) ? 'white' : 'var(--text-main)',
                        cursor: 'pointer'
                      }}
                    >{region}</button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="options-grid" style={{ gridTemplateColumns: '1fr', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Năm dự định nhập học</label>
                    <select className="form-input" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }} value={formData.intake_year} onChange={e => handleSelect('intake_year', e.target.value)}>
                      <option>2025</option><option>2026</option><option>2027</option><option>2028</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Kỳ học</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {['Mùa Xuân (Spring)', 'Mùa Thu (Fall)'].map(t => (
                        <div key={t} className={`option-card ${formData.term === t ? 'selected' : ''}`} style={{ flex: 1 }} onClick={() => handleSelect('term', t)}>
                          <span style={{ fontWeight: 500 }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ngân sách dự kiến</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {['< 500Tr VNĐ', '500Tr - 1 Tỷ VNĐ', '> 1 Tỷ VNĐ', 'Cần học bổng toàn phần'].map(b => (
                        <div key={b} className={`option-card ${formData.budget === b ? 'selected' : ''}`} onClick={() => handleSelect('budget', b)}>
                          <span style={{ fontWeight: 500 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="journey-cards">
                  <div className={`journey-card ${formData.journey_type === 'Exploring' ? 'selected' : ''}`} onClick={() => handleSelect('journey_type', 'Exploring')}>
                    <Compass size={48} color="var(--primary)" style={{ margin: '0 auto' }} />
                    <h3>Đang tìm kiếm & Khám phá</h3>
                    <p>Mình chưa có mục tiêu cụ thể. Hãy giúp mình tìm ra ngôi trường phù hợp nhất.</p>
                  </div>
                  <div className={`journey-card ${formData.journey_type === 'Targeted' ? 'selected' : ''}`} onClick={() => handleSelect('journey_type', 'Targeted')}>
                    <Target size={48} color="#10b981" style={{ margin: '0 auto' }} />
                    <h3>Đã có mục tiêu rõ ràng</h3>
                    <p>Mình đã biết rõ danh sách các trường và muốn bắt đầu chuẩn bị hồ sơ ngay.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="onboarding-footer">
          {step > 1 ? (
            <button className="btn btn-outline" onClick={prevStep}><ChevronLeft size={16}/> Quay lại</button>
          ) : <div></div>}
          
          {step < 4 ? (
            <button className="btn btn-primary" onClick={nextStep} disabled={step === 1 && !formData.education_level}>
              Tiếp theo <ChevronRight size={16}/>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!formData.journey_type || loading}>
              {loading ? 'Đang lưu...' : 'Hoàn thành Profile'} <Send size={16}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
