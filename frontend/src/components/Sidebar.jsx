import { 
  LayoutDashboard, 
  Files, 
  FileText, 
  GraduationCap, 
  PenTool, 
  Wand2,
  Moon,
  Sun,
  Brain,
  Compass,
  Shield,
  LogOut,
  Mic,
  UserCheck,
  Cpu
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Sidebar.css';

export default function Sidebar({ isDarkMode, toggleDarkMode, lang, setLang }) {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  
  const fullName = profile?.full_name ? profile.full_name : (profile?.name ? profile.name : 'Khách');
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
        <GraduationCap className="logo-icon" size={32} />
        <div>
          <h1 className="logo-text">PathSync</h1>
          <span className="logo-subtext">{lang === 'vi' ? 'Nền tảng du học' : 'Study Abroad Platform'}</span>
        </div>
      </div>

      <div className="search-container">
        <input type="text" placeholder={lang === 'vi' ? 'Tìm kiếm nhanh...' : 'Quick search...'} className="search-input" />
      </div>

      {profile?.role !== 'admin' && profile?.role !== 'mentor' && (
        <div className="menu-section">
          <h2 className="menu-title">{lang === 'vi' ? 'LỘ TRÌNH ỨNG TUYỂN' : 'APPLICATION JOURNEY'}</h2>
          <nav className="menu-items">
          <NavLink to="/dashboard" className="menu-item" end>
            <LayoutDashboard size={20} />
            <span>{lang === 'vi' ? 'Bản đồ Lộ trình' : 'Journey Map'}</span>
          </NavLink>
          <NavLink to="/universities" className="menu-item">
            <Compass size={20} />
            <span>{lang === 'vi' ? 'Khám phá Trường' : 'Explore Universities'}</span>
          </NavLink>
          <NavLink to="/explore" className="menu-item">
            <GraduationCap size={20} />
            <span>{lang === 'vi' ? 'Chương trình & Học bổng' : 'Programs & Scholarships'}</span>
          </NavLink>
          <NavLink to="/applications" className="menu-item">
            <Files size={20} />
            <span>{lang === 'vi' ? 'Quản lý Hồ sơ' : 'Manage Applications'}</span>
          </NavLink>
          <NavLink to="/documents" className="menu-item">
            <FileText size={20} />
            <span>{lang === 'vi' ? 'Tài liệu của tôi' : 'My Documents'}</span>
          </NavLink>
          </nav>
        </div>
      )}

      {profile?.role !== 'admin' && profile?.role !== 'mentor' && (
        <div className="menu-section">
          <h2 className="menu-title">{lang === 'vi' ? 'CÔNG CỤ AI' : 'AI TOOLS'}</h2>
          <nav className="menu-items">
          <NavLink to="/persona-lab" className="menu-item">
            <Brain size={20} />
            <span>{lang === 'vi' ? 'Cố vấn AI (Mentor)' : 'AI Mentor'}</span>
          </NavLink>
          <NavLink to="/essay-copilot" className="menu-item ai-tool">
            <PenTool size={20} />
            <div className="ai-tool-text">
              <span>{lang === 'vi' ? 'Trợ lý Viết luận' : 'Essay Copilot'}</span>
              <span className="sub">{lang === 'vi' ? 'Đánh giá & gợi ý' : 'Review & Suggestions'}</span>
            </div>
            <span className="ai-badge">AI</span>
          </NavLink>
          <NavLink to="/mock-interview" className="menu-item">
            <Mic size={20} />
            <span>{lang === 'vi' ? 'Phỏng vấn Giả lập (Micro-Sim)' : 'Mock Interview Sim'}</span>
          </NavLink>
          <NavLink to="/smart-match" className="menu-item">
            <Wand2 size={20} />
            <span>{lang === 'vi' ? 'Gợi ý Thông minh' : 'Smart Match'}</span>
          </NavLink>
          </nav>
        </div>
      )}

      {profile?.role === 'mentor' && (
        <div className="menu-section">
          <h2 className="menu-title">{lang === 'vi' ? 'QUẢN LÝ CỐ VẤN' : 'MENTOR PORTAL'}</h2>
          <nav className="menu-items">
            <NavLink to="/mentor" className="menu-item" style={{ color: '#10b981', fontWeight: '700' }}>
              <UserCheck size={20} />
              <span>{lang === 'vi' ? 'Thống kê & Quản lý Học sinh' : 'Mentor Portal'}</span>
            </NavLink>
          </nav>
        </div>
      )}

      {profile?.role === 'admin' && (
        <div className="menu-section">
          <h2 className="menu-title">{lang === 'vi' ? 'QUẢN TRỊ VIÊN' : 'ADMINISTRATOR'}</h2>
          <nav className="menu-items">
            <NavLink to="/admin" className="menu-item" style={{ color: '#3b82f6' }}>
              <Shield size={20} />
              <span>{lang === 'vi' ? 'Trang Quản Trị' : 'Admin Dashboard'}</span>
            </NavLink>
          </nav>
        </div>
      )}

      <div className="user-profile">
        <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', flex: 1 }}>
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{fullName}</span>
            <span className="user-class">
              {profile?.role === 'admin' 
                ? (lang === 'vi' ? 'Quản trị viên' : 'Admin') 
                : profile?.role === 'mentor' 
                  ? (lang === 'vi' ? 'Cố vấn' : 'Mentor') 
                  : (lang === 'vi' ? 'Ứng viên' : 'Applicant')}
            </span>
          </div>
        </NavLink>
        <button 
          className="btn-icon-small" 
          style={{ marginLeft: 'auto' }}
          onClick={() => setLang && setLang(lang === 'vi' ? 'en' : 'vi')}
          title="Đổi ngôn ngữ"
        >
          {lang === 'vi' ? 'VI' : 'EN'}
        </button>
        <button 
          className="btn-icon-small" 
          onClick={toggleDarkMode}
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button 
          className="btn-icon-small"
          onClick={handleLogout}
          title={lang === 'vi' ? 'Đăng xuất' : 'Logout'}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
