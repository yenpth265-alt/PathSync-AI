import React, { useState } from 'react';
import { 
  Bot, Cpu, Play, RefreshCw, CheckCircle2, Award, ExternalLink, 
  Sparkles, Layers, ShieldCheck, ArrowRight, UserCheck, Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { runSwarmPipeline } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AgentWorkstreamPage({ lang = 'vi' }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('Đánh giá cơ hội trúng tuyển và lập lộ trình du học Master CS');
  const [gpa, setGpa] = useState(3.6);
  const [ielts, setIelts] = useState(7.5);
  const [field, setField] = useState('Computer Science & AI');
  
  const [isRunning, setIsRunning] = useState(false);
  const [swarmData, setSwarmData] = useState(null);

  const handleStartSwarm = async (e) => {
    e.preventDefault();
    setIsRunning(true);
    setSwarmData(null);
    toast.success(lang === 'vi' ? '🚀 Đã khởi tạo Biệt đội Multi-Agent Swarm!' : '🚀 Swarm initialized!');

    try {
      const res = await runSwarmPipeline(query, { gpa: Number(gpa), ielts: Number(ielts), field });
      setSwarmData(res);
    } catch {
      toast.error('Lỗi khi kích hoạt Swarm');
    } finally {
      setIsRunning(false);
    }
  };

  const agentBadges = {
    ChiefOrchestratorAgent: { name: 'Chief Orchestrator', color: '#8b5cf6', icon: Cpu },
    DataCrawlerAgent: { name: 'Data Crawler (21+ Unis)', color: '#3b82f6', icon: Search },
    MatchingAnalystAgent: { name: 'Matching & Tier Analyst', color: '#f59e0b', icon: Award },
    EssayCritiqueAgent: { name: 'Essay Critique (AI Mentor Pro)', color: '#ec4899', icon: Sparkles },
    MockInterviewAgent: { name: 'Mock Interview & Router', color: '#10b981', icon: UserCheck }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
          <Sparkles size={14} /> Multi-Agent Swarm System (Pha 3 - Live Workstream)
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>
          {lang === 'vi' ? 'Bảng Điều Khiển Live Multi-Agent Swarm' : 'Multi-Agent Live Control Center'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
          {lang === 'vi' ? 'Biệt đội 5 Sub-Agents tự động tương tác, phân tích dữ liệu 21+ trường đại học và lập lộ trình hồ sơ real-time.' : '5 Sub-Agents collaborating autonomously to analyze 21+ global unis.'}
        </p>
      </div>

      {/* Input Control Box */}
      <form onSubmit={handleStartSwarm} style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} color="#8b5cf6" /> {lang === 'vi' ? 'Cấu Hình Yêu Cầu Học Sinh' : 'Student Input Strategy'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Điểm GPA (Thang 4.0):</label>
            <input type="number" step="0.1" value={gpa} onChange={e => setGpa(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Điểm IELTS:</label>
            <input type="number" step="0.5" value={ielts} onChange={e => setIelts(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ngành Nhắm Tới:</label>
            <input type="text" value={field} onChange={e => setField(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Mục Tiêu & Định Hướng:</label>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
        </div>

        <button type="submit" disabled={isRunning} className="btn btn-primary" style={{ alignSelf: 'flex-start', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isRunning ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
          {isRunning ? 'Swarm Đang Thảo Luận & Phân Tích...' : '⚡ Kích Hoạt Multi-Agent Swarm'}
        </button>
      </form>

      {/* Live Stream Panel */}
      {swarmData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Swarm Live Step Logs */}
          <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="#3b82f6" /> {lang === 'vi' ? 'Nhật Ký Thực Thi Live Swarm (Inter-Agent Stream)' : 'Swarm Live Execution Log'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {swarmData.logs.map((log) => {
                const badge = agentBadges[log.AgentName] || { name: log.AgentName, color: '#3b82f6' };
                return (
                  <div key={log.step_index} style={{ background: 'var(--bg-main)', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: `4px solid ${badge.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', background: `${badge.color}15`, color: badge.color }}>
                          Step {log.step_index}: {badge.name}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{log.role_title}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🕒 {log.timestamp}</span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '8px' }}>
                      🧠 <strong>Agent Thought:</strong> "{log.thought}"
                    </p>

                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', background: 'var(--card-bg)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      ✅ <strong>Output:</strong> {log.output}
                    </div>

                    {log.citations && log.citations.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {log.citations.map((c, idx) => (
                          <a key={idx} href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ExternalLink size={12} /> {c.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier Results & Final Synthesis */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#ef4444', marginBottom: '12px' }}>🎯 Tier 1: Reach (Vượt Ngưỡng)</h4>
              {swarmData.reach_programs?.map((p, idx) => (
                <div key={idx} style={{ fontSize: '13px', marginBottom: '8px', padding: '8px', borderRadius: '8px', background: 'var(--bg-main)' }}>
                  <strong>{p.university}</strong> — {p.program} (Score: {p.score}%)
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#3b82f6', marginBottom: '12px' }}>🎯 Tier 2: Target (Vừa Sức)</h4>
              {swarmData.target_programs?.map((p, idx) => (
                <div key={idx} style={{ fontSize: '13px', marginBottom: '8px', padding: '8px', borderRadius: '8px', background: 'var(--bg-main)' }}>
                  <strong>{p.university}</strong> — {p.program} (Score: {p.score}%)
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#10b981', marginBottom: '12px' }}>🎯 Tier 3: Safe (An Toàn)</h4>
              {swarmData.safe_programs?.map((p, idx) => (
                <div key={idx} style={{ fontSize: '13px', marginBottom: '8px', padding: '8px', borderRadius: '8px', background: 'var(--bg-main)' }}>
                  <strong>{p.university}</strong> — {p.program} (Score: {p.score}%)
                </div>
              ))}
            </div>
          </div>

          {/* Final Strategic Synthesis Box */}
          <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6', marginBottom: '6px' }}>Kết Luận Chiến Lược Từ Swarm:</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>{swarmData.final_synthesis}</p>
            </div>
            <button onClick={() => navigate('/universities')} className="btn btn-primary" style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {swarmData.recommended_action} <ArrowRight size={16} />
            </button>
          </div>

        </motion.div>
      )}
    </div>
  );
}
