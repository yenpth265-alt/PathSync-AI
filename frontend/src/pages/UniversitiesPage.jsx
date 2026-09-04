import React, { useState, useEffect } from 'react';
import { Search, MapPin, ExternalLink, Award, DollarSign, BookOpen, Filter, XCircle, Globe, TrendingUp, Calendar, CheckCircle, User, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUniversities, getUniversityDetail, createApplication, getMentors, createBooking } from '../services/api';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const formatRank = (ranking) => {
  const r = Number(ranking);
  if (r > 0 && r < 999) {
    return `#${r}`;
  }
  return 'Top 500 Global';
};

export default function UniversitiesPage({ lang = 'vi' }) {
  const [universities, setUniversities] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  
  const [selectedUni, setSelectedUni] = useState(null);
  const [uniDetail, setUniDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Booking Modal States
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [bookingSlot, setBookingSlot] = useState('T2 19:00');
  const [essayDraftInput, setEssayDraftInput] = useState('');

  useEffect(() => {
    const fetchUnis = async () => {
      setLoading(true);
      try {
        const [resUni, resMentors] = await Promise.all([
          getUniversities().catch(() => []),
          getMentors().catch(() => [])
        ]);
        setUniversities(resUni || []);
        setMentors(resMentors || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnis();
  }, []);

  const handleOpenDetail = async (uni) => {
    setSelectedUni(uni);
    setLoadingDetail(true);
    setUniDetail(null);
    try {
      const res = await getUniversityDetail(uni.id);
      setUniDetail(res);
    } catch (e) {
      toast.error(lang === 'vi' ? 'Không thể tải chi tiết trường' : 'Failed to load university details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApply = async (e, programName) => {
    e.stopPropagation();
    try {
      const appData = {
        university: selectedUni.name,
        country: selectedUni.country,
        deadline: '2026-12-31',
        type: 'Regular Decision'
      };
      const res = await createApplication(appData);
      if (res && res.id) {
        toast.success(`🎉 ${lang === 'vi' ? 'Đã thêm' : 'Successfully added'} "${selectedUni.name}"!`);
      }
    } catch (err) {
      console.error(err);
      toast.error(lang === 'vi' ? 'Lỗi khi thêm hồ sơ' : 'Failed to add application');
    }
  };

  // Built from whatever countries are actually in the data, not a fixed
  // US/Canada-centric list — as the crawler adds more countries, the filter
  // picks them up automatically instead of needing a code change.
  const availableCountries = Array.from(
    new Set(universities.map(u => u.country).filter(Boolean))
  ).sort();

  const filteredData = universities.filter(item => {
    const uniName = item.name || '';
    const location = item.country || '';

    const matchesSearch = uniName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || location === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      {/* Hero Section */}
      <div className="uni-hero" style={{
        background: 'var(--card-bg)',
        borderRadius: '24px',
        padding: '40px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--sidebar-active-bg)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
            <Award size={14} /> {lang === 'vi' ? 'Cơ sở dữ liệu chính thức' : 'Official Database'}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1px', marginBottom: '12px', lineHeight: '1.2' }}>
            {lang === 'vi' ? 'Khám phá Trường Đại Học' : 'Discover Your Perfect University'}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '28px' }}>
            {lang === 'vi' ? 'Dữ liệu được cập nhật trực tiếp từ các trang tuyển sinh chính thức bởi hệ thống AI Crawler của chúng tôi.' : 'Data is aggregated directly from official admission portals using our AI Crawler.'}
          </p>

          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={lang === 'vi' ? "Tìm kiếm trường học, quốc gia..." : "Search universities, countries..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '14px 18px 14px 48px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', fontSize: '15px',
                background: 'var(--secondary)', color: 'var(--text-main)',
                outline: 'none', transition: 'all 0.2s'
              }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', marginRight: '8px' }}>
          <Filter size={16} /> {lang === 'vi' ? 'Quốc gia:' : 'Country:'}
        </div>
        {['All', ...availableCountries].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '500',
              background: filter === f ? 'var(--primary)' : 'var(--card-bg)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              border: filter === f ? 'none' : '1px solid var(--border-color)',
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {f === 'All' ? (lang === 'vi' ? 'Tất cả' : 'All') : f}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '16px', animation: 'spin 1s linear infinite' }}><Search size={32} /></div>
          <p>{lang === 'vi' ? 'Đang tải dữ liệu...' : 'Loading data...'}</p>
        </div>
      )}

      {/* Results List */}
      {!loading && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}
        >
          <AnimatePresence>
            {filteredData.map(item => (
              <motion.div key={item.id} variants={itemVariants} initial="hidden" animate="show" exit="exit" layout
                onClick={() => handleOpenDetail(item)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '16px',
                  background: 'var(--card-bg)', padding: '24px', borderRadius: '20px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.transform = 'translateY(-4px)'; 
                  e.currentTarget.style.borderColor = 'var(--primary)'; 
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'; 
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.transform = 'none'; 
                  e.currentTarget.style.borderColor = 'var(--border-color)'; 
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'var(--primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', fontWeight: 'bold', flexShrink: 0,
                  }}>
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>{item.name}</h2>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {item.country}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={14} color="#10b981" /> Rank: {formatRank(item.world_ranking)}</span>
                  </div>
                  <button style={{ background: 'var(--sidebar-active-bg)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', border: 'none' }}>
                    {lang === 'vi' ? 'Xem Chi Tiết' : 'View Details'}
                  </button>
                </div>
              </motion.div>
            ))}
            
            {filteredData.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '16px' }}>
                  <Search size={32} opacity={0.5} />
                </div>
                <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '8px' }}>{lang === 'vi' ? 'Không tìm thấy trường nào' : 'No universities found'}</h3>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* MENTOR MARKETPLACE SECTION */}
      <div style={{ marginTop: '32px', background: 'var(--card-bg)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
              <CheckCircle size={14} /> Official Mentor Network
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              {lang === 'vi' ? 'Cố Vấn Du Học Đã Xác Thực (Mentor Marketplace)' : 'Verified Mentor Marketplace'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {lang === 'vi' ? 'Đặt lịch tư vấn 1-1 với cựu sinh viên & người nhận học bổng toàn phần từ các trường top đầu.' : 'Book 1-1 strategy sessions with alumni & scholarship recipients.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {mentors.map(m => (
            <div key={m.id} style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                  {m.full_name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{m.full_name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>🎓 {m.university}</span>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                🏆 <strong>Học bổng:</strong> {m.scholarship}<br />
                💬 {m.bio}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>{(m.hourly_rate || 120000).toLocaleString()} VNĐ</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> / 45 phút</span>
                </div>
                <button 
                  onClick={() => setSelectedMentor(m)}
                  className="btn btn-primary" 
                  style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '12px' }}
                >
                  {lang === 'vi' ? 'Đặt Lịch 1-1' : 'Book 1-1 Session'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{lang === 'vi' ? 'Đặt Lịch Hẹn Tư Vấn 1-1' : 'Book 1-1 Session'}</h3>
                <button onClick={() => setSelectedMentor(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <XCircle size={24} />
                </button>
              </div>

              <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--border-color)', display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                  {selectedMentor.full_name.charAt(0)}
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
                } catch (e) {
                  toast.error('Mentor đã có lịch hẹn vào giờ này, vui lòng chọn hôm khác!');
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{lang === 'vi' ? 'Chọn Slot Thời Gian Rảnh:' : 'Select Available Slot:'}</label>
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
                  <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{lang === 'vi' ? 'Đính Kèm Bài Luận Nháp (Nếu Có):' : 'Attach Essay Draft (Optional):'}</label>
                  <textarea 
                    rows={4} 
                    placeholder={lang === 'vi' ? 'Dán bản nháp Personal Statement/SOP để AI Mentor Pro chấm trước...' : 'Paste essay draft for AI pre-review...'}
                    value={essayDraftInput}
                    onChange={e => setEssayDraftInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phí Booking (Tư vấn 1-1):</span>
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

      {/* University Detail Modal */}
      <AnimatePresence>
        {selectedUni && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setSelectedUni(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ 
                background: 'var(--bg-main)', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', 
                overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '20px',
                      background: 'var(--primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '36px', fontWeight: 'bold'
                    }}>
                      {selectedUni.name.charAt(0)}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>{selectedUni.name}</h2>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {selectedUni.country}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16} /> {selectedUni.type}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={16} /> Rank: {formatRank(selectedUni.world_ranking)}</span>
                        {selectedUni.acceptance_rate > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600 }}>Tỷ lệ trúng tuyển: {selectedUni.acceptance_rate}%</span>
                        )}
                      </div>

                      <div style={{ marginTop: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a 
                          href={selectedUni.website || selectedUni.source_url || `https://www.google.com/search?q=${encodeURIComponent(selectedUni.name)}`}
                          target="_blank" 
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
                        >
                          🌐 Trang Web Chính Thức
                        </a>
                        {selectedUni.source_url && (
                          <a 
                            href={selectedUni.source_url} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', border: '1px solid var(--border-color)' }}
                          >
                            🔗 {selectedUni.source_label || 'Nguồn Cào Dữ Liệu'}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUni(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
                    <XCircle size={28} />
                  </button>
                </div>
              </div>

              <div style={{ padding: '32px', flex: 1 }}>
                {loadingDetail ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <p>{lang === 'vi' ? 'Đang phân tích dữ liệu...' : 'Loading details...'}</p>
                  </div>
                ) : uniDetail ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Programs Section */}
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={20} color="var(--primary)" /> {lang === 'vi' ? 'Các Chương Trình Đào Tạo' : 'Programs'}
                      </h3>
                      {uniDetail.programs && uniDetail.programs.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                          {uniDetail.programs.map(prog => (
                            <div key={prog.id} style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{prog.name}</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{lang === 'vi' ? 'Học phí' : 'Tuition'}:</span>
                                  <strong style={{ color: '#10b981' }}>${prog.tuition_per_year}/yr</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{lang === 'vi' ? 'Yêu cầu GPA' : 'Min GPA'}:</span>
                                  <strong>{prog.min_gpa > 0 ? prog.min_gpa : 'N/A'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{lang === 'vi' ? 'IELTS tối thiểu' : 'Min IELTS'}:</span>
                                  <strong>{prog.min_ielts > 0 ? prog.min_ielts : 'N/A'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{lang === 'vi' ? 'Thời hạn' : 'Deadline'}:</span>
                                  <strong>{prog.deadline || 'Rolling'}</strong>
                                </div>
                              </div>
                              <button onClick={(e) => handleApply(e, prog.name)} style={{ width: '100%', padding: '10px', background: 'var(--sidebar-active-bg)', color: 'var(--primary)', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                                {lang === 'vi' ? 'Thêm vào Hồ Sơ' : 'Add to Kanban'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Chưa có thông tin ngành học.' : 'No programs available.'}</p>
                      )}
                    </div>

                    {/* Scholarships Section */}
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={20} color="#f59e0b" /> {lang === 'vi' ? 'Cơ Hội Học Bổng' : 'Scholarships'}
                      </h3>
                      {uniDetail.scholarships && uniDetail.scholarships.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {uniDetail.scholarships.map(sch => (
                            <div key={sch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                              <div>
                                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{sch.name}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{sch.coverage} • Deadline: {sch.deadline}</p>
                              </div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                                ${sch.amount_per_year}/yr
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Chưa có thông tin học bổng.' : 'No scholarships available.'}</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
