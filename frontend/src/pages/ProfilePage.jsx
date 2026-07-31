import React, { useState, useEffect } from 'react';
import { User, Book, Target, AlertTriangle, Save } from 'lucide-react';
import { getProfile, updateProfile } from '../services/api';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const AVATARS = ['🎓', '👨‍💻', '👩‍💻', '🌍', '🚀', '💡', '📚', '🎯'];

export default function ProfilePage({ lang = 'vi' }) {
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
    } catch {
      console.error(e);
      setProfile({
        full_name: '', email: '', avatar: '🎓', gpa: '', work_experience: '',
        current_major: '', education_level: '', target_degree: '', journey_type: 'Exploring',
        fields: [], regions: [], budget: ''
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
      toast.success(lang === 'vi' ? 'Đã lưu hồ sơ thành công!' : 'Profile saved successfully!');
    } catch {
      toast.error(lang === 'vi' ? 'Lưu thất bại. Vui lòng kiểm tra lại kết nối!' : 'Failed to save. Please check your connection!');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return <div style={{ padding: '40px' }}>{lang === 'vi' ? 'Đang tải...' : 'Loading...'}</div>;

  const completionPercent = profile.full_name ? 85 : 50; // Mock completion calculation

  return (
    <div className="profile-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">{lang === 'vi' ? 'Hồ sơ của bạn' : 'Your Profile'}</h1>
          <p className="page-subtitle">{lang === 'vi' ? 'Quản lý thông tin cá nhân và định hướng du học.' : 'Manage your personal info and study abroad goals.'}</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...') : (lang === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes')}
        </button>
      </header>

      <div className="profile-card">
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${completionPercent}%` }}></div>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Mức độ hoàn thiện' : 'Completion'}: {completionPercent}%</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="profile-card">
            <h2 className="profile-card-title"><User size={20} /> {lang === 'vi' ? 'Thông tin Cá nhân' : 'Personal Info'}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>{lang === 'vi' ? 'Họ và Tên' : 'Full Name'}</label>
                <input className="form-input" name="full_name" value={profile.full_name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" value={profile.email} disabled />
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h2 className="profile-card-title"><Book size={20} /> {lang === 'vi' ? 'Hồ sơ Học thuật' : 'Academic Profile'}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>{lang === 'vi' ? 'GPA (hệ 4.0)' : 'GPA (4.0 scale)'}</label>
                <input className="form-input" type="number" step="0.1" name="gpa" value={profile.gpa} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>{lang === 'vi' ? 'Chuyên ngành hiện tại' : 'Current Major'}</label>
                <input className="form-input" name="current_major" value={profile.current_major} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>{lang === 'vi' ? 'Trình độ hiện tại' : 'Current Level'}</label>
                <select className="form-input" name="education_level" value={profile.education_level} onChange={handleChange}>
                  <option value="High School">{lang === 'vi' ? 'Học sinh cấp 3' : 'High School Student'}</option>
                  <option value="Undergraduate">{lang === 'vi' ? 'Sinh viên đại học' : 'Undergraduate Student'}</option>
                  <option value="Graduate">{lang === 'vi' ? 'Đã tốt nghiệp' : 'Graduate'}</option>
                  <option value="Working">{lang === 'vi' ? 'Đang đi làm' : 'Working Professional'}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{lang === 'vi' ? 'Bằng cấp mục tiêu' : 'Target Degree'}</label>
                <select className="form-input" name="target_degree" value={profile.target_degree} onChange={handleChange}>
                  <option value="Bachelor">{lang === 'vi' ? 'Cử nhân (Bachelor)' : 'Bachelor'}</option>
                  <option value="Master">{lang === 'vi' ? 'Thạc sĩ (Master)' : 'Master'}</option>
                  <option value="MBA">MBA</option>
                  <option value="PhD">{lang === 'vi' ? 'Tiến sĩ (PhD)' : 'PhD'}</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="profile-card danger-zone">
            <h2 className="profile-card-title"><AlertTriangle size={20} /> {lang === 'vi' ? 'Khu vực nguy hiểm' : 'Danger Zone'}</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>{lang === 'vi' ? 'Khi bạn xóa tài khoản, mọi dữ liệu sẽ mất vĩnh viễn. Vui lòng cân nhắc kỹ.' : 'Deleting your account is permanent and cannot be undone. Please be certain.'}</p>
            <button className="btn" style={{ background: 'var(--danger)', color: 'white' }}>{lang === 'vi' ? 'Xóa tài khoản' : 'Delete Account'}</button>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="profile-card">
            <h2 className="profile-card-title">{lang === 'vi' ? 'Chọn Avatar' : 'Choose Avatar'}</h2>
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
            <h2 className="profile-card-title"><Target size={20} /> {lang === 'vi' ? 'Hướng đi của bạn' : 'Your Journey Type'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="journey_type" value="Exploring" checked={profile.journey_type === 'Exploring'} onChange={handleChange} />
                {lang === 'vi' ? 'Đang tìm kiếm & Khám phá' : 'Exploring Options'}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="journey_type" value="Targeted" checked={profile.journey_type === 'Targeted'} onChange={handleChange} />
                {lang === 'vi' ? 'Đã có mục tiêu rõ ràng' : 'Targeted (Clear Goals)'}
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
