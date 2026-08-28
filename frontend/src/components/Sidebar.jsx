import { useState, useRef, useEffect } from 'react';
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
  ChevronsUpDown,
  UserRound,
  Languages
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Sidebar.css';

export default function Sidebar({ isDarkMode, toggleDarkMode, lang, setLang }) {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const fullName = profile?.full_name ? profile.full_name : (profile?.name ? profile.name : 'Khách');
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const roleLabel = profile?.role === 'admin'
    ? (lang === 'vi' ? 'Quản trị viên' : 'Admin')
    : profile?.role === 'mentor'
      ? (lang === 'vi' ? 'Cố vấn' : 'Mentor')
      : (lang === 'vi' ? 'Ứng viên' : 'Applicant');

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    const handleEscape = (e) => { if (e.key === 'Escape') setIsMenuOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToProfile = () => {
    setIsMenuOpen(false);
    navigate('/profile');
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
        <GraduationCap className="logo-icon" size={26} />
        <div>
          <h1 className="logo-text">PathSync</h1>
          <span className="logo-subtext">{lang === 'vi' ? 'Nền tảng du học' : 'Study Abroad Platform'}</span>
        </div>
      </div>

      {/* Only this middle section scrolls — the logo, search bar and profile
          card above/below always stay in view instead of the whole sidebar
          scrolling past the profile card. */}
      <div className="menu-scroll-area">
        {profile?.role !== 'admin' && profile?.role !== 'mentor' && (
          <div className="menu-section">
            <h2 className="menu-title">{lang === 'vi' ? 'LỘ TRÌNH ỨNG TUYỂN' : 'APPLICATION JOURNEY'}</h2>
            <nav className="menu-items">
            <NavLink to="/dashboard" className="menu-item" end>
              <LayoutDashboard size={17} />
              <span>{lang === 'vi' ? 'Bản đồ Lộ trình' : 'Journey Map'}</span>
            </NavLink>
            <NavLink to="/universities" className="menu-item">
              <Compass size={17} />
              <span>{lang === 'vi' ? 'Khám phá Trường' : 'Explore Universities'}</span>
            </NavLink>
            <NavLink to="/explore" className="menu-item">
              <GraduationCap size={17} />
              <span>{lang === 'vi' ? 'Chương trình & Học bổng' : 'Programs & Scholarships'}</span>
            </NavLink>
            <NavLink to="/applications" className="menu-item">
              <Files size={17} />
              <span>{lang === 'vi' ? 'Quản lý Hồ sơ' : 'Manage Applications'}</span>
            </NavLink>
            <NavLink to="/documents" className="menu-item">
              <FileText size={17} />
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
              <Brain size={17} />
              <span>{lang === 'vi' ? 'Cố vấn AI (Mentor)' : 'AI Mentor'}</span>
            </NavLink>
            <NavLink to="/essay-copilot" className="menu-item ai-tool">
              <PenTool size={17} />
              <div className="ai-tool-text">
                <span>{lang === 'vi' ? 'Trợ lý Viết luận' : 'Essay Copilot'}</span>
                <span className="sub">{lang === 'vi' ? 'Đánh giá & gợi ý' : 'Review & Suggestions'}</span>
              </div>
              <span className="ai-badge">AI</span>
            </NavLink>
            <NavLink to="/mock-interview" className="menu-item">
              <Mic size={17} />
              <span>{lang === 'vi' ? 'Phỏng vấn Giả lập (Micro-Sim)' : 'Mock Interview Sim'}</span>
            </NavLink>
            <NavLink to="/smart-match" className="menu-item">
              <Wand2 size={17} />
              <span>{lang === 'vi' ? 'Gợi ý Thông minh' : 'Smart Match'}</span>
            </NavLink>
            </nav>
          </div>
        )}

        {profile?.role === 'mentor' && (
          <div className="menu-section">
            <h2 className="menu-title">{lang === 'vi' ? 'QUẢN LÝ CỐ VẤN' : 'MENTOR PORTAL'}</h2>
            <nav className="menu-items">
              <NavLink to="/mentor" className="menu-item">
                <UserCheck size={17} />
                <span>{lang === 'vi' ? 'Thống kê & Quản lý Học sinh' : 'Mentor Portal'}</span>
              </NavLink>
            </nav>
          </div>
        )}

        {profile?.role === 'admin' && (
          <div className="menu-section">
            <h2 className="menu-title">{lang === 'vi' ? 'QUẢN TRỊ VIÊN' : 'ADMINISTRATOR'}</h2>
            <nav className="menu-items">
              <NavLink to="/admin" className="menu-item">
                <Shield size={17} />
                <span>{lang === 'vi' ? 'Trang Quản Trị' : 'Admin Dashboard'}</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      <div className="user-menu-anchor" ref={menuRef}>
        {isMenuOpen && (
          <div className="user-menu">
            <button className="user-menu-item" onClick={goToProfile}>
              <UserRound size={15} />
              <span>{lang === 'vi' ? 'Xem hồ sơ' : 'View profile'}</span>
            </button>

            <div className="user-menu-row">
              <span className="user-menu-row-label"><Languages size={15} /> {lang === 'vi' ? 'Ngôn ngữ' : 'Language'}</span>
              <button className="user-menu-toggle" onClick={() => setLang && setLang(lang === 'vi' ? 'en' : 'vi')}>
                {lang === 'vi' ? 'VI' : 'EN'}
              </button>
            </div>

            <div className="user-menu-row">
              <span className="user-menu-row-label">{isDarkMode ? <Sun size={15} /> : <Moon size={15} />} {lang === 'vi' ? 'Giao diện' : 'Theme'}</span>
              <button className="user-menu-toggle" onClick={toggleDarkMode}>
                {isDarkMode ? (lang === 'vi' ? 'Tối' : 'Dark') : (lang === 'vi' ? 'Sáng' : 'Light')}
              </button>
            </div>

            <div className="user-menu-divider" />

            <button className="user-menu-item danger" onClick={handleLogout}>
              <LogOut size={15} />
              <span>{lang === 'vi' ? 'Đăng xuất' : 'Log out'}</span>
            </button>
          </div>
        )}

        <button className="user-profile" onClick={() => setIsMenuOpen((v) => !v)} aria-expanded={isMenuOpen}>
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{fullName}</span>
            <span className="user-class">{roleLabel}</span>
          </div>
          <ChevronsUpDown size={15} className="user-profile-chevron" />
        </button>
      </div>
    </div>
  );
}
