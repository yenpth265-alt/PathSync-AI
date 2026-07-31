import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getPrograms, getScholarships, createApplication, getProfile } from '../services/api';
import { isDemoSession } from '../services/demoStore';

export default function ExplorePage() {
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
      } catch {
        setItems([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab, searchQuery, filterRegion]);

  const handleApply = async (e, item) => {
    e.stopPropagation();
    try {
      await createApplication({
        university: item.university || item.uniName,
        deadline: item.deadline || 'Dec 31, 2026',
        type: 'Regular Decision'
      });
      toast.success(`🎉 Added to your Applications board!`);
    } catch {
      toast.error('Failed to add application. Please ensure backend services are running.');
    }
  };

  const filteredItems = items.filter(i => {
    const name = (i.name || i.title || '').toLowerCase();
    const uni = (i.university || i.uniName || '').toLowerCase();
    const loc = (i.location || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || uni.includes(query) || loc.includes(query);
    const matchesRegion = filterRegion === 'All' || loc.includes(filterRegion);
    return matchesSearch && matchesRegion;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Khám phá Cơ hội</h1>
          <p className="page-subtitle">Tìm kiếm chương trình học và học bổng hoàn hảo dành cho bạn.</p>
        </div>
      </header>

      {isDemoSession() && <div role="status" style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }}>
        Bạn đang xem workspace mẫu. Thông tin cơ hội chỉ để minh hoạ, không phải dữ liệu tuyển sinh đã được xác thực; hãy luôn kiểm tra trang chính thức trước khi đưa ra quyết định.
      </div>}

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <button 
          className="btn" 
          style={{ background: activeTab === 'programs' ? 'var(--primary)' : 'transparent', color: activeTab === 'programs' ? '#fff' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('programs')}
        >
          Chương trình học
        </button>
        <button 
          className="btn" 
          style={{ background: activeTab === 'scholarships' ? 'var(--primary)' : 'transparent', color: activeTab === 'scholarships' ? '#fff' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('scholarships')}
        >
          Học bổng
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder={`Tìm kiếm ${activeTab === 'programs' ? 'chương trình' : 'học bổng'}...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
          />
        </div>
        <select 
          value={filterRegion} 
          onChange={(e) => setFilterRegion(e.target.value)}
          style={{ padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
        >
          <option value="All">Tất cả khu vực</option>
          <option value="USA">Mỹ</option>
          <option value="UK">Anh</option>
          <option value="Germany">Đức</option>
          <option value="Australia">Úc</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredItems.map(item => (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '20px',
                background: 'var(--card-bg)', padding: '20px', borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: item.color || 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                {(item.university || item.uniName || 'U').charAt(0)}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)' }}>{item.university || item.uniName}</h3>
                <p style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '500', marginBottom: '8px' }}>{item.name || item.title}</p>
                {(item.source_label || item.source_url) && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {item.source_label || 'Nguồn chính thức'}
                    {item.source_url ? (
                      <>
                        {' '}
                        · <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Mở trang gốc</a>
                      </>
                    ) : null}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {item.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} /> {item.tuition || item.funding}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {item.deadline}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <span style={{ 
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                  background: item.match === 'Reach' ? '#fee2e2' : item.match === 'Target' ? '#e0f2fe' : '#dcfce7',
                  color: item.match === 'Reach' ? '#ef4444' : item.match === 'Target' ? '#0ea5e9' : '#22c55e'
                }}>
                  {item.match === 'Reach' ? 'Thử Thách' : item.match === 'Target' ? 'Phù Hợp' : 'An Toàn'}
                </span>
                <button onClick={(e) => handleApply(e, item)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Plus size={14} /> Thêm vào Hồ sơ
                </button>
              </div>
            </motion.div>
          ))}
          {filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Không tìm thấy kết quả phù hợp.</div>
          )}
        </div>
      )}
    </div>
  );
}
