import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getPrograms, getScholarships, createApplication, getProfile } from '../services/api';
import { isDemoSession } from '../services/demoStore';

export default function ExplorePage({ lang = 'vi' }) {
  const [activeTab, setActiveTab] = useState('programs'); // 'programs' | 'scholarships'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');

  useEffect(() => {
    getProfile().catch(console.error);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'programs') {
          const res = await getPrograms({ search: searchQuery, region: filterRegion });
          setItems(Array.isArray(res) ? res : []);
        } else {
          const res = await getScholarships({ search: searchQuery, region: filterRegion });
          setItems(Array.isArray(res) ? res : []);
        }
      } catch (e) {
        console.error("Explore fetch error:", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, searchQuery, filterRegion]);

  const getUniName = (item) => {
    if (!item) return 'University';
    if (typeof item.university === 'object' && item.university !== null) {
      return item.university.name || 'University';
    }
    if (typeof item.university === 'string' && item.university) {
      return item.university;
    }
    return item.uniName || item.name || 'University';
  };

  const getLocation = (item) => {
    if (!item) return 'Worldwide';
    if (item.location) return item.location;
    if (typeof item.university === 'object' && item.university !== null) {
      return item.university.country || item.university.location || 'Worldwide';
    }
    return 'Worldwide';
  };

  const getPriceOrFunding = (item) => {
    if (!item) return 'N/A';
    if (item.tuition_per_year) return `$${item.tuition_per_year}/yr`;
    if (item.amount_per_year) return `$${item.amount_per_year}/yr`;
    if (item.coverage) return item.coverage;
    if (item.funding) return item.funding;
    if (item.tuition) return item.tuition;
    return 'N/A';
  };

  const handleApply = async (e, item) => {
    e.stopPropagation();
    const uniName = getUniName(item);
    try {
      await createApplication({
        university: uniName,
        deadline: item.deadline || '2026-12-31',
        type: 'Regular Decision'
      });
      toast.success(lang === 'vi' ? `🎉 Đã thêm ${uniName} vào danh sách Hồ sơ!` : `🎉 Added ${uniName} to your Applications board!`);
    } catch {
      toast.error(lang === 'vi' ? 'Lỗi khi thêm hồ sơ. Hãy kiểm tra lại backend!' : 'Failed to add application. Please ensure backend services are running.');
    }
  };

  const filteredItems = items.filter(i => {
    if (!i) return false;
    const name = (i.name || i.title || '').toLowerCase();
    const uni = getUniName(i).toLowerCase();
    const loc = getLocation(i).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || uni.includes(query) || loc.includes(query);
    const matchesRegion = filterRegion === 'All' || loc.includes(filterRegion.toLowerCase());
    return matchesSearch && matchesRegion;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="page-header">
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            {lang === 'vi' ? 'Chương Trình & Học Bổng' : 'Programs & Scholarships'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {lang === 'vi' ? 'Tìm kiếm chương trình học và học bổng chuẩn xác nhất từ hệ thống crawler.' : 'Discover academic programs and scholarships worldwide.'}
          </p>
        </div>
      </header>

      {isDemoSession() && (
        <div role="status" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }}>
          {lang === 'vi' 
            ? 'Bạn đang xem workspace mẫu. Thông tin cơ hội chỉ để minh hoạ, hãy luôn kiểm tra trang chính thức.' 
            : 'You are in sample workspace mode. Verify on official portals before taking action.'}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <button 
          className="btn" 
          style={{ 
            background: activeTab === 'programs' ? 'var(--primary)' : 'var(--card-bg)', 
            color: activeTab === 'programs' ? '#fff' : 'var(--text-muted)',
            border: activeTab === 'programs' ? 'none' : '1px solid var(--border-color)'
          }}
          onClick={() => setActiveTab('programs')}
        >
          {lang === 'vi' ? 'Chương trình học' : 'Academic Programs'}
        </button>
        <button 
          className="btn" 
          style={{ 
            background: activeTab === 'scholarships' ? 'var(--primary)' : 'var(--card-bg)', 
            color: activeTab === 'scholarships' ? '#fff' : 'var(--text-muted)',
            border: activeTab === 'scholarships' ? 'none' : '1px solid var(--border-color)'
          }}
          onClick={() => setActiveTab('scholarships')}
        >
          {lang === 'vi' ? 'Học bổng' : 'Scholarships'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder={lang === 'vi' ? `Tìm kiếm ${activeTab === 'programs' ? 'chương trình' : 'học bổng'}...` : `Search ${activeTab === 'programs' ? 'programs' : 'scholarships'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', outline: 'none' }}
          />
        </div>
        <select 
          value={filterRegion} 
          onChange={(e) => setFilterRegion(e.target.value)}
          style={{ padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', outline: 'none' }}
        >
          <option value="All">{lang === 'vi' ? 'Tất cả khu vực' : 'All Regions'}</option>
          <option value="USA">{lang === 'vi' ? 'Mỹ (USA)' : 'USA'}</option>
          <option value="UK">{lang === 'vi' ? 'Anh (UK)' : 'UK'}</option>
          <option value="Germany">{lang === 'vi' ? 'Đức' : 'Germany'}</option>
          <option value="Singapore">{lang === 'vi' ? 'Singapore' : 'Singapore'}</option>
          <option value="Australia">{lang === 'vi' ? 'Úc' : 'Australia'}</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Đang tải dữ liệu...' : 'Loading data...'}</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredItems.map((item, idx) => {
            const uniName = getUniName(item);
            const location = getLocation(item);
            const price = getPriceOrFunding(item);
            return (
              <motion.div key={item.id || idx} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '20px',
                  background: 'var(--card-bg)', padding: '20px', borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', flexShrink: 0 }}>
                  {uniName.charAt(0)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)' }}>{uniName}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '500', marginBottom: '8px' }}>{item.name || item.title}</p>
                  {(item.source_label || item.source_url) && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {item.source_label || (lang === 'vi' ? 'Nguồn chính thức' : 'Official Source')}
                      {item.source_url ? (
                        <>
                          {' '}
                          · <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{lang === 'vi' ? 'Mở trang gốc' : 'Open Source'}</a>
                        </>
                      ) : null}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} /> {price}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {item.deadline || 'Rolling'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: item.match === 'Reach' ? 'rgba(239, 68, 68, 0.1)' : item.match === 'Target' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: item.match === 'Reach' ? '#ef4444' : item.match === 'Target' ? '#3b82f6' : '#22c55e'
                  }}>
                    {item.match === 'Reach' ? (lang === 'vi' ? 'Thử Thách' : 'Reach') : item.match === 'Target' ? (lang === 'vi' ? 'Phù Hợp' : 'Target') : (lang === 'vi' ? 'An Toàn' : 'Safety')}
                  </span>
                  <button onClick={(e) => handleApply(e, item)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    <Plus size={14} /> {lang === 'vi' ? 'Thêm vào Hồ sơ' : 'Add to Applications'}
                  </button>
                </div>
              </motion.div>
            );
          })}
          {filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Không tìm thấy kết quả phù hợp.' : 'No matching results found.'}</div>
          )}
        </div>
      )}
    </div>
  );
}
