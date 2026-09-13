import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Book, Target, AlertTriangle, Save } from 'lucide-react';
import { getProfile, updateProfile, getProfileCompletion, deleteMyAccount } from '../services/api';
import { useAuth } from '../context/useAuth';
import { convertGpa10To4 } from '../utils/gpa';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const AVATARS = ['🎓', '👨‍💻', '👩‍💻', '🌍', '🚀', '💡', '📚', '🎯'];

export default function ProfilePage({ lang = 'vi' }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [gpaScale, setGpaScale] = useState('4'); // '4' or '10' — profile.gpa is always stored on the 4.0 scale
  const [gpaRaw, setGpaRaw] = useState(''); // what the user is actually typing, on gpaScale

  // Switching scale re-interprets whatever's already stored (4.0) rather than
  // trying to also convert in-progress keystrokes — simpler and never risks
  // saving a value on the wrong scale.
  const handleGpaScaleChange = (newScale) => {
    setGpaScale(newScale);
    setGpaRaw('');
  };

  const handleGpaInputChange = (value) => {
    setGpaRaw(value);
    const canonical = gpaScale === '10' ? convertGpa10To4(value) : (parseFloat(value) || '');
    setProfile((p) => ({ ...p, gpa: canonical === null ? '' : canonical }));
  };

  useEffect(() => {
    loadProfile();
    getProfileCompletion()
      .then(res => setCompletionPercent(res.completion_percentage || 0))
      .catch(e => console.error('Failed to load profile completion', e));
  }, []);

  // Seed the raw GPA input from the loaded (always 4.0-scale) value, once —
  // after that, handleGpaInputChange/handleGpaScaleChange own gpaRaw.
  useEffect(() => {
    if (profile?.gpa !== undefined && profile?.gpa !== '' && gpaRaw === '') {
      setGpaRaw(String(profile.gpa));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.gpa]);

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

  const handleDeleteAccount = async () => {
    const confirmMsg = lang === 'vi'
      ? 'Bạn có chắc chắn muốn xoá tài khoản? Hành động này không thể hoàn tác từ phía bạn.'
      : 'Are you sure you want to delete your account? This cannot be undone from your side.';
    if (!window.confirm(confirmMsg)) return;
    setDeleting(true);
    try {
      await deleteMyAccount();
      toast.success(lang === 'vi' ? 'Tài khoản đã được xoá.' : 'Account deleted.');
      logout();
      navigate('/login', { replace: true });
    } catch (e) {
      toast.error(e.message || (lang === 'vi' ? 'Xoá tài khoản thất bại' : 'Failed to delete account'));
      setDeleting(false);
    }
  };

  if (loading || !profile) return <div style={{ padding: '40px' }}>{lang === 'vi' ? 'Đang tải...' : 'Loading...'}</div>;

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>GPA</label>
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-color)', borderRadius: '8px', padding: '2px' }}>
                    {['4', '10'].map((scale) => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => handleGpaScaleChange(scale)}
                        style={{
                          padding: '2px 8px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          background: gpaScale === scale ? 'var(--primary)' : 'transparent',
                          color: gpaScale === scale ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        {lang === 'vi' ? `Thang ${scale}` : `${scale}.0`}
                      </button>
                    ))}
                  </div>
                </div>
                <input className="form-input" type="number" step="0.1" min="0" max={gpaScale} value={gpaRaw} onChange={(e) => handleGpaInputChange(e.target.value)} />
                {gpaScale === '10' && gpaRaw !== '' && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {lang === 'vi' ? `≈ ${convertGpa10To4(gpaRaw) ?? '—'}/4.0 (quy đổi tham khảo)` : `≈ ${convertGpa10To4(gpaRaw) ?? '—'}/4.0 (estimate)`}
                  </p>
                )}
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
            <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? (lang === 'vi' ? 'Đang xoá...' : 'Deleting...') : (lang === 'vi' ? 'Xóa tài khoản' : 'Delete Account')}
            </button>
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
