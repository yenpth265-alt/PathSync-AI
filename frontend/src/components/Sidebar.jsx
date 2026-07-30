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
  LogOut
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ isDarkMode, toggleDarkMode }) {
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
          <span className="logo-subtext">Nền tảng du học</span>
        </div>
      </div>

      <div className="search-container">
        <input type="text" placeholder="Tìm kiếm nhanh..." className="search-input" />
      </div>

      <div className="menu-section">
        <h2 className="menu-title">LỘ TRÌNH ỨNG TUYỂN</h2>
        <nav className="menu-items">
          <NavLink to="/dashboard" className="menu-item" end>
            <LayoutDashboard size={20} />
            <span>Bản đồ Lộ trình</span>
          </NavLink>
          <NavLink to="/explore" className="menu-item">
            <Compass size={20} />
            <span>Khám phá Trường</span>
          </NavLink>
          <NavLink to="/applications" className="menu-item">
            <Files size={20} />
            <span>Quản lý Hồ sơ</span>
            <span className="badge">3</span>
          </NavLink>
          <NavLink to="/documents" className="menu-item">
            <FileText size={20} />
            <span>Tài liệu của tôi</span>
          </NavLink>
        </nav>
      </div>

      <div className="menu-section">
        <h2 className="menu-title">CÔNG CỤ AI</h2>
        <nav className="menu-items">
          <NavLink to="/persona-lab" className="menu-item">
            <Brain size={20} />
            <span>Cố vấn AI (Mentor)</span>
          </NavLink>
          <NavLink to="/essay-copilot" className="menu-item ai-tool">
            <PenTool size={20} />
            <div className="ai-tool-text">
              <span>Trợ lý Viết luận</span>
              <span className="sub">Đánh giá & gợi ý</span>
            </div>
            <span className="ai-badge">AI</span>
          </NavLink>
          <NavLink to="/smart-match" className="menu-item">
            <Wand2 size={20} />
            <span>Gợi ý Thông minh</span>
          </NavLink>
        </nav>
      </div>

      <div className="user-profile">
        <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', flex: 1 }}>
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{fullName}</span>
            <span className="user-class">Ứng viên</span>
          </div>
        </NavLink>
        <button 
          className="btn-icon-small" 
          style={{ marginLeft: 'auto' }}
          onClick={toggleDarkMode}
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button 
          className="btn-icon-small"
          onClick={handleLogout}
          title="Đăng xuất"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
