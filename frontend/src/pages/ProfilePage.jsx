import React, { useState, useEffect } from 'react';
import { User, Book, Target, Settings, AlertTriangle, Save } from 'lucide-react';
import { getProfile, updateProfile } from '../services/api';
import './ProfilePage.css';

const AVATARS = ['🎓', '👨‍💻', '👩‍💻', '🌍', '🚀', '💡', '📚', '🎯'];

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data || {
        full_name: '', email: '', avatar: '🎓', gpa: '', work_experience: '',
        current_major: '', education_level: '', target_degree: '', journey_type: 'Exploring',
        fields: [], regions: [], budget: ''
      });
    } catch (e) {
      console.error(e);
      // fallback
      setProfile({
        full_name: 'Nguyễn Văn A', email: 'guest@pathsync.ai', avatar: '🎓', gpa: '3.8', work_experience: '1',
        current_major: 'Khoa học máy tính', education_level: 'Undergraduate', target_degree: 'Master', journey_type: 'Exploring',
        fields: ['CS'], regions: ['USA'], budget: '> 1 Tỷ VNĐ'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(p => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(profile);
      alert('Đã lưu hồ sơ thành công!');
    } catch (e) {
      alert('Lưu thất bại. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return <div style={{ padding: '40px' }}>Đang tải...</div>;

  const completionPercent = profile.full_name ? 85 : 50; // Mock completion calculation

  return (
    <div className="profile-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Hồ sơ của bạn</h1>
          <p className="page-subtitle">Quản lý thông tin cá nhân và định hướng du học.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </button>
      </header>

      <div className="profile-card">
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${completionPercent}%` }}></div>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Mức độ hoàn thiện: {completionPercent}%</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="profile-card">
            <h2 className="profile-card-title"><User size={20} /> Thông tin Cá nhân</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Họ và Tên</label>
                <input className="form-input" name="full_name" value={profile.full_name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" value={profile.email} disabled />
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h2 className="profile-card-title"><Book size={20} /> Hồ sơ Học thuật</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>GPA (hệ 4.0)</label>
                <input className="form-input" type="number" step="0.1" name="gpa" value={profile.gpa} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Chuyên ngành hiện tại</label>
                <input className="form-input" name="current_major" value={profile.current_major} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Trình độ hiện tại</label>
                <select className="form-input" name="education_level" value={profile.education_level} onChange={handleChange}>
                  <option value="High School">Học sinh cấp 3</option>
                  <option value="Undergraduate">Sinh viên đại học</option>
                  <option value="Graduate">Đã tốt nghiệp</option>
                  <option value="Working">Đang đi làm</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bằng cấp mục tiêu</label>
                <select className="form-input" name="target_degree" value={profile.target_degree} onChange={handleChange}>
                  <option value="Bachelor">Cử nhân (Bachelor)</option>
                  <option value="Master">Thạc sĩ (Master)</option>
                  <option value="MBA">MBA</option>
                  <option value="PhD">Tiến sĩ (PhD)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="profile-card danger-zone">
            <h2 className="profile-card-title"><AlertTriangle size={20} /> Khu vực nguy hiểm</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>Khi bạn xóa tài khoản, mọi dữ liệu sẽ mất vĩnh viễn. Vui lòng cân nhắc kỹ.</p>
            <button className="btn" style={{ background: 'var(--danger)', color: 'white' }}>Xóa tài khoản</button>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="profile-card">
            <h2 className="profile-card-title">Chọn Avatar</h2>
            <div className="avatar-grid">
              {AVATARS.map(a => (
                <div 
                  key={a} 
                  className={`avatar-option ${profile.avatar === a ? 'selected' : ''}`}
                  onClick={() => setProfile(p => ({ ...p, avatar: a }))}
                >
                  {a}
                </div>
              ))}
            </div>
          </div>
          
          <div className="profile-card">
            <h2 className="profile-card-title"><Target size={20} /> Hướng đi của bạn</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="journey_type" value="Exploring" checked={profile.journey_type === 'Exploring'} onChange={handleChange} />
                Đang tìm kiếm & Khám phá
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="journey_type" value="Targeted" checked={profile.journey_type === 'Targeted'} onChange={handleChange} />
                Đã có mục tiêu rõ ràng
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
