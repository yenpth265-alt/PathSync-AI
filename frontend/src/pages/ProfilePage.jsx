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
        full_name: 'Guest User', email: 'guest@example.com', avatar: '🎓', gpa: '3.8', work_experience: '1',
        current_major: 'Computer Science', education_level: 'Undergraduate', target_degree: 'Master', journey_type: 'Exploring',
        fields: ['CS'], regions: ['USA'], budget: '> 1B VND'
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
      alert('Profile saved successfully!');
    } catch (e) {
      alert('Failed to save profile. Is the backend running?');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return <div style={{ padding: '40px' }}>Loading...</div>;

  const completionPercent = profile.full_name ? 85 : 50; // Mock completion calculation

  return (
    <div className="profile-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Your Profile</h1>
          <p className="page-subtitle">Manage your personal information and preferences.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      <div className="profile-card">
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${completionPercent}%` }}></div>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Profile Completion: {completionPercent}%</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="profile-card">
            <h2 className="profile-card-title"><User size={20} /> Personal Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" name="full_name" value={profile.full_name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" value={profile.email} disabled />
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h2 className="profile-card-title"><Book size={20} /> Academic Profile</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>GPA (out of 4.0)</label>
                <input className="form-input" type="number" step="0.1" name="gpa" value={profile.gpa} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Current Major</label>
                <input className="form-input" name="current_major" value={profile.current_major} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Education Level</label>
                <select className="form-input" name="education_level" value={profile.education_level} onChange={handleChange}>
                  <option value="High School">High School</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Working">Working</option>
                </select>
              </div>
              <div className="form-group">
                <label>Target Degree</label>
                <select className="form-input" name="target_degree" value={profile.target_degree} onChange={handleChange}>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                  <option value="MBA">MBA</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="profile-card danger-zone">
            <h2 className="profile-card-title"><AlertTriangle size={20} /> Danger Zone</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>Once you delete your account, there is no going back. Please be certain.</p>
            <button className="btn" style={{ background: 'var(--danger)', color: 'white' }}>Delete Account</button>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="profile-card">
            <h2 className="profile-card-title">Choose Avatar</h2>
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
            <h2 className="profile-card-title"><Target size={20} /> Journey Type</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="journey_type" value="Exploring" checked={profile.journey_type === 'Exploring'} onChange={handleChange} />
                I'm Exploring
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="journey_type" value="Targeted" checked={profile.journey_type === 'Targeted'} onChange={handleChange} />
                I Have a Target
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
