import React, { useState } from 'react';
import { Target, Search, CheckCircle2, ChevronRight, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SmartMatchPage() {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleNext = () => setStep(step + 1);
  
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setResults([
        { name: 'Stanford University', match: '92%', type: 'Reach' },
        { name: 'University of Washington', match: '88%', type: 'Target' },
        { name: 'Penn State University', match: '95%', type: 'Safety' },
      ]);
    }, 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', paddingTop: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Smart Match AI</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '500px' }}>
          Let our AI analyze your profile and find the universities that are the perfect fit for you.
        </p>
      </div>

      {!results && !isAnalyzing && (
        <div style={{ 
          background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-color)', borderRadius: '24px',
          padding: '40px', width: '100%', maxWidth: '600px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--text-main)' }}>Step 1: Academic Profile</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>GPA (Out of 4.0)</label>
                    <input type="number" step="0.1" placeholder="3.8" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>IELTS / TOEFL Score</label>
                    <input type="text" placeholder="IELTS 7.5" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: '16px', justifyContent: 'center' }} onClick={handleNext}>
                    Next Step <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--text-main)' }}>Step 2: Preferences</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Intended Major</label>
                    <input type="text" placeholder="Computer Science" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Preferred Location</label>
                    <input type="text" placeholder="California, USA" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(1)}>Back</button>
                    <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)' }} onClick={handleAnalyze}>
                      <Wand2 size={16} /> Analyze Matches
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
          <h2 style={{ fontSize: '20px', color: 'var(--text-main)', fontWeight: '600' }}>AI is analyzing 4,200+ universities...</h2>
        </motion.div>
      )}

      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>Your Top Matches</h2>
            <button className="btn btn-outline" onClick={() => { setResults(null); setStep(1); }}>Retake</button>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {results.map((res, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.2 }} style={{
                background: 'rgba(255,255,255,0.6)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', 
                      background: res.type === 'Reach' ? '#fee2e2' : res.type === 'Target' ? '#e0f2fe' : '#dcfce7',
                      color: res.type === 'Reach' ? '#ef4444' : res.type === 'Target' ? '#0ea5e9' : '#22c55e'
                    }}>{res.type}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>{res.name}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>{res.match}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Match Score</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
