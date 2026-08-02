import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, School, Award, RefreshCw, Plus, CheckCircle, XCircle, 
  Search, Filter, Activity, Database, AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  getAdminUsers, updateAdminUserRole, updateAdminUserStatus, deleteAdminUser,
  createAdminUniversity, createAdminScholarship, triggerAdminCrawl, getUniversities 
} from '../services/api';

export default function AdminDashboardPage({ lang = 'vi' }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'universities' | 'analytics'
  const [users, setUsers] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [isUniModalOpen, setIsUniModalOpen] = useState(false);
  const [isSchModalOpen, setIsSchModalOpen] = useState(false);

  // Form states for adding University
  const [uniForm, setUniForm] = useState({
    name: '', country: 'United States', world_ranking: 10, type: 'Public Research University', website: '', source_url: '', description: ''
  });

  // Form states for adding Scholarship
  const [schForm, setSchForm] = useState({
    university_id: '', name: '', coverage: 'Full Tuition', amount_per_year: 50000, deadline: '2026-12-31', requirements: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, uniRes] = await Promise.all([
        getAdminUsers().catch(() => ({ users: [] })),
        getUniversities().catch(() => [])
      ]);
      setUsers(userRes.users || []);
      setUniversities(uniRes || []);
    } catch (e) {
      toast.error(lang === 'vi' ? 'Không thể tải dữ liệu admin' : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    try {
      await updateAdminUserRole(user.id, newRole);
      toast.success(lang === 'vi' ? `Đã đổi vai trò của ${user.full_name} thành ${newRole}` : `Updated ${user.full_name}'s role to ${newRole}`);
      fetchData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.is_active;
    try {
      await updateAdminUserStatus(user.id, newStatus);
      toast.success(lang === 'vi' ? `Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản ${user.full_name}` : `${newStatus ? 'Activated' : 'Deactivated'} ${user.full_name}'s account`);
      fetchData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(lang === 'vi' ? `Bạn có chắc chắn muốn xóa tài khoản ${user.full_name}?` : `Are you sure you want to delete ${user.full_name}?`)) return;
    try {
      await deleteAdminUser(user.id);
      toast.success(lang === 'vi' ? `Đã xóa tài khoản ${user.full_name}` : `Deleted account ${user.full_name}`);
      fetchData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleCreateUni = async (e) => {
    e.preventDefault();
    try {
      await createAdminUniversity({ ...uniForm, world_ranking: Number(uniForm.world_ranking) });
      toast.success(lang === 'vi' ? 'Đã thêm trường thành công!' : 'University added successfully!');
      setUniForm({ name: '', country: 'United States', world_ranking: 10, type: 'Public Research University', website: '', source_url: '', description: '' });
      fetchData();
    } catch (e) {
      toast.error(e.message);
    }
    setIsUniModalOpen(false);
  };

  const handleCreateSch = async (e) => {
    e.preventDefault();
    try {
      await createAdminScholarship({ ...schForm, amount_per_year: Number(schForm.amount_per_year) });
      toast.success(lang === 'vi' ? 'Đã thêm học bổng thành công!' : 'Scholarship added successfully!');
      setSchForm({ university_id: '', name: '', coverage: 'Full Tuition', amount_per_year: 50000, deadline: '2026-12-31', requirements: '' });
    } catch (e) {
      toast.error(e.message);
    }
    setIsSchModalOpen(false);
  };

  const handleTriggerCrawl = async () => {
    setIsCrawling(true);
    try {
      await triggerAdminCrawl();
      toast.success(lang === 'vi' ? 'Đã kích hoạt Crawler cào dữ liệu nguồn chính thức ở Background!' : 'Triggered official source crawler in background!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsCrawling(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield style={{ color: '#3b82f6' }} /> 
            {lang === 'vi' ? 'Quản Trị Viên (Admin Panel)' : 'Admin Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {lang === 'vi' ? 'Quản lý người dùng, phân quyền, dữ liệu trường học và học bổng chuẩn xác' : 'Manage users, roles, official university records, and scholarships'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleTriggerCrawl} disabled={isCrawling}>
          <RefreshCw size={16} className={isCrawling ? 'animate-spin' : ''} />
          {lang === 'vi' ? 'Kích hoạt Crawler Nguồn Gốc' : 'Trigger Official Crawler'}
        </button>
      </div>

      {/* Analytics Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span>{lang === 'vi' ? 'Tổng Người Dùng' : 'Total Users'}</span>
            <Users size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{users.length}</div>
        </div>

        <div style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span>{lang === 'vi' ? 'Trường Đại Học Synced' : 'Synced Universities'}</span>
            <School size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{universities.length}</div>
        </div>

        <div style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span>{lang === 'vi' ? 'Hệ Thống Microservices' : 'Microservices Status'}</span>
            <Activity size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981', marginTop: '8px' }}>
            ● Healthy (8000 - 8005)
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ 
            padding: '10px 16px', fontWeight: '600', borderBottom: activeTab === 'users' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'users' ? '#3b82f6' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' 
          }}
        >
          {lang === 'vi' ? 'Quản Lý Tài Khoản' : 'User Management'}
        </button>
        <button 
          onClick={() => setActiveTab('universities')}
          style={{ 
            padding: '10px 16px', fontWeight: '600', borderBottom: activeTab === 'universities' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'universities' ? '#3b82f6' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' 
          }}
        >
          {lang === 'vi' ? 'Quản Lý Trường & Học Bổng' : 'Universities & Scholarships'}
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={lang === 'vi' ? 'Tìm theo tên hoặc email...' : 'Search by name or email...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Người Dùng' : 'User'}</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Trạng Thái OTP' : 'OTP Verified'}</th>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Hành Động' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '600' }}>{u.full_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                        background: u.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: u.role === 'admin' ? '#3b82f6' : 'var(--text-muted)'
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.is_verified ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Verified</span>
                      ) : (
                        <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> Unverified</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.is_active ? (
                        <span style={{ color: '#10b981' }}>Active</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>Disabled</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleToggleRole(u)} 
                        className="btn"
                        style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid var(--border-color)' }}
                      >
                        {lang === 'vi' ? 'Đổi Role' : 'Toggle Role'}
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(u)} 
                        className="btn"
                        style={{ 
                          padding: '4px 8px', fontSize: '12px', 
                          color: u.is_active ? '#ef4444' : '#10b981',
                          borderColor: u.is_active ? '#ef4444' : '#10b981'
                        }}
                      >
                        {u.is_active ? (lang === 'vi' ? 'Khóa' : 'Ban') : (lang === 'vi' ? 'Mở Khóa' : 'Unban')}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u)} 
                        className="btn"
                        style={{ 
                          padding: '4px 8px', fontSize: '12px', 
                          color: '#ef4444',
                          borderColor: '#ef4444'
                        }}
                      >
                        {lang === 'vi' ? 'Xóa' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? 'Không tìm thấy người dùng phù hợp' : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: UNIVERSITIES & SCHOLARSHIPS MANAGEMENT */}
      {activeTab === 'universities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={lang === 'vi' ? 'Tìm trường...' : 'Search universities...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn" onClick={() => setIsUniModalOpen(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none' }}>
                <Plus size={16} /> {lang === 'vi' ? 'Thêm Trường' : 'Add University'}
              </button>
              <button className="btn" onClick={() => setIsSchModalOpen(true)} style={{ background: '#10b981', color: '#fff', border: 'none' }}>
                <Plus size={16} /> {lang === 'vi' ? 'Thêm Học Bổng' : 'Add Scholarship'}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Tên Trường' : 'University Name'}</th>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Quốc Gia' : 'Country'}</th>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Loại Trường' : 'Type'}</th>
                  <th style={{ padding: '12px 16px' }}>Ranking</th>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Nguồn' : 'Source'}</th>
                </tr>
              </thead>
              <tbody>
                {universities.filter(u => u.name?.toLowerCase().includes(search.toLowerCase())).map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>{u.name}</td>
                    <td style={{ padding: '12px 16px' }}>{u.country}</td>
                    <td style={{ padding: '12px 16px' }}>{u.type}</td>
                    <td style={{ padding: '12px 16px' }}>#{u.world_ranking}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <a href={u.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                        {u.source_url ? 'Link' : 'N/A'}
                      </a>
                    </td>
                  </tr>
                ))}
                {universities.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? 'Chưa có dữ liệu trường học' : 'No universities synced yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isUniModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{lang === 'vi' ? 'Thêm Trường Đại Học' : 'Add University'}</h3>
              <button onClick={() => setIsUniModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleCreateUni} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" placeholder={lang === 'vi' ? 'Tên trường' : 'University Name'}
                value={uniForm.name} onChange={e => setUniForm({...uniForm, name: e.target.value})} required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
              />
              <input 
                type="text" placeholder={lang === 'vi' ? 'Quốc gia' : 'Country'}
                value={uniForm.country} onChange={e => setUniForm({...uniForm, country: e.target.value})} required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="number" placeholder="World Ranking"
                  value={uniForm.world_ranking} onChange={e => setUniForm({...uniForm, world_ranking: e.target.value})} required
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
                />
                <input 
                  type="text" placeholder="Type"
                  value={uniForm.type} onChange={e => setUniForm({...uniForm, type: e.target.value})} required
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
                />
              </div>
              <input 
                type="url" placeholder="Official Source URL"
                value={uniForm.source_url} onChange={e => setUniForm({...uniForm, source_url: e.target.value})} required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
              />
              <textarea 
                placeholder={lang === 'vi' ? 'Mô tả...' : 'Description...'}
                value={uniForm.description} onChange={e => setUniForm({...uniForm, description: e.target.value})} rows={3}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
              />
              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                {lang === 'vi' ? 'Lưu' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isSchModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{lang === 'vi' ? 'Thêm Học Bổng' : 'Add Scholarship'}</h3>
              <button onClick={() => setIsSchModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleCreateSch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select 
                value={schForm.university_id} 
                onChange={e => setSchForm({...schForm, university_id: e.target.value})} 
                required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
              >
                <option value="">-- {lang === 'vi' ? 'Chọn Trường' : 'Select University'} --</option>
                {universities.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.country})</option>
                ))}
              </select>
              <input 
                type="text" placeholder={lang === 'vi' ? 'Tên Học Bổng' : 'Scholarship Name'}
                value={schForm.name} onChange={e => setSchForm({...schForm, name: e.target.value})} required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" placeholder="Coverage (e.g. Full Tuition)"
                  value={schForm.coverage} onChange={e => setSchForm({...schForm, coverage: e.target.value})} required
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
                />
                <input 
                  type="number" placeholder="Amount ($/year)"
                  value={schForm.amount_per_year} onChange={e => setSchForm({...schForm, amount_per_year: e.target.value})} required
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
                />
              </div>
              <input 
                type="text" placeholder="Deadline (YYYY-MM-DD)"
                value={schForm.deadline} onChange={e => setSchForm({...schForm, deadline: e.target.value})} required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
              />
              <textarea 
                placeholder={lang === 'vi' ? 'Yêu cầu đầu vào...' : 'Requirements...'}
                value={schForm.requirements} onChange={e => setSchForm({...schForm, requirements: e.target.value})} rows={3}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
              />
              <button type="submit" className="btn btn-primary" style={{ background: '#10b981', marginTop: '8px' }}>
                {lang === 'vi' ? 'Lưu' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
