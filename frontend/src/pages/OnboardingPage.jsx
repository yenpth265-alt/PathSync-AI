import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, GraduationCap, Briefcase, Globe, Target, Compass, Send } from 'lucide-react';
import { updateProfile } from '../services/api';
import './OnboardingPage.css';

export default function OnboardingPage() {
  const navigate = useNavigate();
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
      if (formData.journey_type === 'Exploring') navigate('/explore');
      else navigate('/');
    } catch (e) {
      alert('Failed to save profile. Proceeding to dashboard.');
      navigate('/');
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="step-indicators">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`step-dot ${i <= step ? 'active' : ''}`} />
            ))}
          </div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)', marginBottom: '8px' }}>
            {step === 1 && "Welcome! Let's get started"}
            {step === 2 && "What are your interests?"}
            {step === 3 && "Plan & Budget"}
            {step === 4 && "Choose your path"}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {step === 1 && "Tell us about your current academic status."}
            {step === 2 && "Select the fields and regions you want to study in."}
            {step === 3 && "When are you planning to go and what is your budget?"}
            {step === 4 && "How can PathSync help you best today?"}
          </p>
        </div>

        <div className="onboarding-content">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 style={{ marginBottom: '16px' }}>Current Education Level</h3>
                <div className="options-grid" style={{ marginBottom: '32px' }}>
                  {['High School', 'Undergraduate', 'Graduate', 'Working'].map(lvl => (
                    <div key={lvl} className={`option-card ${formData.education_level === lvl ? 'selected' : ''}`} onClick={() => handleSelect('education_level', lvl)}>
                      <div className="option-icon"><GraduationCap /></div>
                      <span style={{ fontWeight: 500 }}>{lvl}</span>
                    </div>
                  ))}
                </div>
                
                <h3 style={{ marginBottom: '16px' }}>Target Degree</h3>
                <div className="options-grid">
                  {['Bachelor', 'Master', 'MBA', 'PhD'].map(deg => (
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
                <h3 style={{ marginBottom: '16px' }}>Fields of Interest (Max 3)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
                  {['CS/IT', 'Business', 'Finance', 'Engineering', 'Data Science', 'Design', 'Health', 'Other'].map(field => (
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

                <h3 style={{ marginBottom: '16px' }}>Preferred Regions</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {['North America', 'Western Europe', 'East Asia', 'Southeast Asia', 'Oceania'].map(region => (
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
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Intake Year</label>
                    <select className="form-input" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }} value={formData.intake_year} onChange={e => handleSelect('intake_year', e.target.value)}>
                      <option>2025</option><option>2026</option><option>2027</option><option>2028</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Term</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {['Spring', 'Fall'].map(t => (
                        <div key={t} className={`option-card ${formData.term === t ? 'selected' : ''}`} style={{ flex: 1 }} onClick={() => handleSelect('term', t)}>
                          <span style={{ fontWeight: 500 }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Budget Range</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {['< 500M VND', '500M-1B VND', '> 1B VND', 'Need full scholarship'].map(b => (
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
                    <h3>I'm Exploring</h3>
                    <p>I don't have a specific program in mind yet. Help me find the best fit.</p>
                  </div>
                  <div className={`journey-card ${formData.journey_type === 'Targeted' ? 'selected' : ''}`} onClick={() => handleSelect('journey_type', 'Targeted')}>
                    <Target size={48} color="#10b981" style={{ margin: '0 auto' }} />
                    <h3>I Have a Target</h3>
                    <p>I already know what schools/programs I want to apply to.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="onboarding-footer">
          {step > 1 ? (
            <button className="btn btn-outline" onClick={prevStep}><ChevronLeft size={16}/> Back</button>
          ) : <div></div>}
          
          {step < 4 ? (
            <button className="btn btn-primary" onClick={nextStep} disabled={step === 1 && !formData.education_level}>
              Next Step <ChevronRight size={16}/>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!formData.journey_type || loading}>
              {loading ? 'Setting up...' : 'Complete Profile'} <Send size={16}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
