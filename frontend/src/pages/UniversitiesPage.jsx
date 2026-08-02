import React, { useState, useEffect } from 'react';
import { Search, MapPin, ExternalLink, Award, DollarSign, BookOpen, Filter, XCircle, Globe, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUniversities, getUniversityDetail, createApplication } from '../services/api';
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  
  const [selectedUni, setSelectedUni] = useState(null);
  const [uniDetail, setUniDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchUnis = async () => {
      setLoading(true);
      try {
        const res = await getUniversities();
        setUniversities(res || []);
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

  const filteredData = universities.filter(item => {
    const uniName = item.name || '';
    const location = item.country || '';
    const type = item.type || '';
    
    const matchesSearch = uniName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'USA' && location.includes('United States')) || type.includes(filter);
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(100,108,255,0.1) 0%, rgba(236,72,153,0.1) 100%)',
        borderRadius: '24px',
        padding: '48px 40px',
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(100,108,255,0.2)', color: '#8890ff', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
            <Award size={14} /> {lang === 'vi' ? 'Cơ sở dữ liệu chính thức' : 'Official Database'}
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1px', marginBottom: '12px', lineHeight: '1.2' }}>
            {lang === 'vi' ? 'Khám phá ' : 'Discover Your Perfect '}
            <span style={{ background: 'linear-gradient(to right, #646cff, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {lang === 'vi' ? 'Trường Đại Học' : 'University'}
            </span>
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '32px' }}>
            {lang === 'vi' ? 'Dữ liệu được cập nhật trực tiếp từ các trang tuyển sinh chính thức bởi hệ thống AI Crawler của chúng tôi.' : 'Data is aggregated directly from official admission portals using our AI Crawler.'}
          </p>
          
          <div style={{ position: 'relative', width: '100%', display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={lang === 'vi' ? "Tìm kiếm trường học, quốc gia..." : "Search universities, countries..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', padding: '16px 20px 16px 52px', borderRadius: '16px', 
                  border: '1px solid var(--border-color)', fontSize: '16px',
                  background: 'var(--card-bg)', color: 'var(--text-main)',
                  outline: 'none', transition: 'all 0.2s'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div style={{ position: 'absolute', right: '-10%', top: '-20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', right: '10%', bottom: '-30%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(100,108,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', marginRight: '8px' }}>
          <Filter size={16} /> Filters:
        </div>
        {['All', 'USA', 'Public Research', 'Private'].map(f => (
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
            {f}
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
                    background: 'linear-gradient(135deg, #646cff 0%, #3b82f6 100%)', color: 'white',
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
                  <button style={{ background: 'rgba(100,108,255,0.1)', color: '#8890ff', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', border: 'none' }}>
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
                      background: 'linear-gradient(135deg, #646cff 0%, #3b82f6 100%)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '36px', fontWeight: 'bold'
                    }}>
                      {selectedUni.name.charAt(0)}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>{selectedUni.name}</h2>
                      <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {selectedUni.country}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16} /> {selectedUni.type}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={16} /> Rank: {formatRank(selectedUni.world_ranking)}</span>
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
                        <BookOpen size={20} color="#3b82f6" /> {lang === 'vi' ? 'Các Chương Trình Đào Tạo' : 'Programs'}
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
                              <button onClick={(e) => handleApply(e, prog.name)} style={{ width: '100%', padding: '10px', background: 'rgba(100,108,255,0.1)', color: '#8890ff', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
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
