import React, { useState, useEffect } from 'react';
import { 
  Bot, Cpu, Play, RefreshCw, CheckCircle2, Award, ExternalLink, 
  Sparkles, Layers, ShieldCheck, ArrowRight, UserCheck, Search, History, Clock, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { runSwarmPipeline, getSwarmHistory, getMentors, createBooking } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AgentWorkstreamPage({ lang = 'vi' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'history'
  const [query, setQuery] = useState('Đánh giá cơ hội trúng tuyển và lập lộ trình du học Master CS');
  const [gpa, setGpa] = useState(3.6);
  const [ielts, setIelts] = useState(7.5);
  const [field, setField] = useState('Computer Science & AI');
  
  const [isRunning, setIsRunning] = useState(false);
  const [swarmData, setSwarmData] = useState(null);
  const [historySessions, setHistorySessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Booking Modal States
  const [mentorsList, setMentorsList] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [bookingSlot, setBookingSlot] = useState('T2 19:00');
  const [essayDraftInput, setEssayDraftInput] = useState('');

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await getSwarmHistory();
      setHistorySessions(res || []);
    } catch {
      console.error("Failed to load swarm history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const res = await getMentors();
      setMentorsList(res || []);
    } catch (e) {
      console.error("Error fetching mentors", e);
    }
  };

  useEffect(() => {
    fetchMentors();
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleStartSwarm = async (e) => {
    e.preventDefault();
    setIsRunning(true);
    setSwarmData(null);
    toast.success(lang === 'vi' ? '🚀 Đã khởi tạo Biệt đội Multi-Agent Swarm!' : '🚀 Swarm initialized!');

    try {
      const res = await runSwarmPipeline(query, { gpa: Number(gpa), ielts: Number(ielts), field });
      setSwarmData(res);
      fetchHistory();
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
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            <Sparkles size={14} /> Multi-Agent Swarm System (Pha 3 - Live Workstream)
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>
            {lang === 'vi' ? 'Bảng Điều Khiển Multi-Agent Swarm' : 'Multi-Agent Live Control Center'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {lang === 'vi' ? 'Biệt đội 5 Sub-Agents tự động tương tác, phân tích dữ liệu 21+ trường đại học và lưu trữ toàn vẹn lịch sử.' : '5 Sub-Agents collaborating autonomously to analyze 21+ global unis.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'var(--card-bg)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setActiveTab('live')}
            style={{ 
              padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer',
              background: activeTab === 'live' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'live' ? '#fff' : 'var(--text-muted)'
            }}
          >
            ⚡ Live Swarm
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ 
              padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer',
              background: activeTab === 'history' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'history' ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <History size={14} /> {lang === 'vi' ? 'Lịch Sử Đã Lưu' : 'Saved Sessions'} ({historySessions.length})
          </button>
        </div>
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
            <button 
              onClick={() => {
                if (swarmData.recommended_action.includes('Mentor')) {
                  const harvardMentor = mentorsList.find(m => m.full_name.includes('Minh Anh') || m.university.includes('Harvard')) || mentorsList[0];
                  if (harvardMentor) {
                    setSelectedMentor(harvardMentor);
                    return;
                  }
                }
                navigate('/universities');
              }} 
              className="btn btn-primary" 
              style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
            >
              {swarmData.recommended_action} <ArrowRight size={16} />
            </button>
          </div>

        </motion.div>
      )}

      {/* SWARM HISTORY TAB */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="#8b5cf6" /> {lang === 'vi' ? 'Lịch Sử Các Phiên Swarm Đã Lưu Trong SQLite Database' : 'Saved Swarm Sessions in SQLite'}
          </h3>

          {loadingHistory && (
            <div style={{ padding: '40px', textCenter: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px' }} />
              Đang tải lịch sử phiên Swarm từ pathsync-agent.db...
            </div>
          )}

          {!loadingHistory && historySessions.map((session) => (
            <div key={session.id} style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                  Session ID: {session.id}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> {new Date(session.created_at).toLocaleString()}
                </span>
              </div>

              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                🎯 Prompt: "{session.user_prompt}"
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>📊 GPA: <strong>{session.gpa}</strong></span>
                <span>🎓 IELTS: <strong>{session.ielts}</strong></span>
                <span>🏫 Ngành: <strong>{session.field}</strong></span>
              </div>

              <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                {session.final_synthesis}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                  ✅ Đã lưu vĩnh viễn {session.logs?.length || 5} bước thực thi của Sub-Agents
                </span>
                <button 
                  onClick={() => {
                    let parsedProgs = {};
                    try {
                      if (session.programs_json) {
                        parsedProgs = JSON.parse(session.programs_json);
                      }
                    } catch (e) {
                      console.error("Error parsing programs", e);
                    }

                    setSwarmData({
                      session_id: session.id,
                      user_prompt: session.user_prompt,
                      logs: session.logs || [],
                      final_synthesis: session.final_synthesis,
                      recommended_action: session.recommended_action,
                      reach_programs: parsedProgs.reach || [],
                      target_programs: parsedProgs.target || [],
                      safe_programs: parsedProgs.safe || []
                    });
                    setActiveTab('live');
                    toast.success('Đã tải lại phiên Swarm!');
                  }}
                  className="btn btn-outline" 
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Xem Chi Tiết Nhật Ký
                </button>
              </div>
            </div>
          ))}

          {!loadingHistory && historySessions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              Chưa có phiên Swarm nào được lưu. Hãy bấm "⚡ Kích Hoạt Multi-Agent Swarm" ở tab Live!
            </div>
          )}
        </div>
      )}

      {/* MENTOR BOOKING MODAL */}
      <AnimatePresence>
        {selectedMentor && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setSelectedMentor(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-main)', padding: '28px', borderRadius: '24px', width: '100%', maxWidth: '550px', border: '1px solid var(--border-color)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{lang === 'vi' ? 'Đặt Lịch Hẹn Tư Vấn 1-1 (Đặt Nhanh Từ Swarm)' : 'Book Swarm Recommended Session'}</h3>
                <button onClick={() => setSelectedMentor(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <XCircle size={24} />
                </button>
              </div>

              <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--border-color)', display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                  {selectedMentor.full_name?.charAt(0)}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{selectedMentor.full_name}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>🎓 {selectedMentor.university} • 🏆 {selectedMentor.scholarship}</p>
                </div>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await createBooking({ mentor_id: selectedMentor.user_id || selectedMentor.id, slot_time: bookingSlot, essay_draft: essayDraftInput });
                  toast.success('🎉 Đã gửi yêu cầu đặt lịch cho Mentor!');
                  setSelectedMentor(null);
                  setEssayDraftInput('');
                } catch {
                  toast.error('Lỗi khi đặt lịch');
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Chọn Slot Thời Gian Rảnh:</label>
                  <select 
                    value={bookingSlot} 
                    onChange={e => setBookingSlot(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                  >
                    <option value="T2 19:00">🗓️ Thứ Hai - 19:00 PM</option>
                    <option value="T4 20:00">🗓️ Thứ Tư - 20:00 PM</option>
                    <option value="T6 18:30">🗓️ Thứ Sáu - 18:30 PM</option>
                    <option value="CN 10:00">🗓️ Chủ Nhật - 10:00 AM</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Đính Kèm Bài Luận Nháp (Nếu Có):</label>
                  <textarea 
                    rows={4} 
                    placeholder="Dán bản nháp Personal Statement để Mentor cùng AI Mentor Pro rà soát trước..."
                    value={essayDraftInput}
                    onChange={e => setEssayDraftInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phí Tư Vấn:</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{(selectedMentor.hourly_rate || 120000).toLocaleString()} VNĐ</div>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    🚀 Xác Nhận Đặt Lịch
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
