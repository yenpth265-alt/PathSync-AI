import React from 'react';
import { 
  LayoutDashboard, 
  Files, 
  FileText, 
  GraduationCap, 
  Library, 
  MessageSquare, 
  Bell, 
  PenTool, 
  Wand2 
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="logo-container">
        <GraduationCap className="logo-icon" size={32} />
        <div>
          <h1 className="logo-text">PathSync</h1>
          <span className="logo-subtext">Application Manager</span>
        </div>
      </div>

      <div className="search-container">
        <input type="text" placeholder="Search..." className="search-input" />
      </div>

      <div className="menu-section">
        <h2 className="menu-title">MAIN MENU</h2>
        <nav className="menu-items">
          <a href="#" className="menu-item active">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </a>
          <a href="#" className="menu-item">
            <Files size={20} />
            <span>Applications</span>
            <span className="badge">3</span>
          </a>
          <a href="#" className="menu-item">
            <FileText size={20} />
            <span>Documents</span>
          </a>
          <a href="#" className="menu-item">
            <GraduationCap size={20} />
            <span>Universities</span>
          </a>
          <a href="#" className="menu-item">
            <Library size={20} />
            <span>Resources</span>
          </a>
          <a href="#" className="menu-item">
            <MessageSquare size={20} />
            <span>Messages</span>
            <span className="badge">2</span>
          </a>
          <a href="#" className="menu-item">
            <Bell size={20} />
            <span>Notifications</span>
            <span className="badge">5</span>
          </a>
        </nav>
      </div>

      <div className="menu-section">
        <h2 className="menu-title">AI TOOLS</h2>
        <nav className="menu-items">
          <a href="#" className="menu-item ai-tool">
            <PenTool size={20} />
            <div className="ai-tool-text">
              <span>Essay Copilot</span>
              <span className="sub">AI writing assistant</span>
            </div>
            <span className="ai-badge">AI</span>
          </a>
          <a href="#" className="menu-item">
            <Wand2 size={20} />
            <span>Smart Match</span>
          </a>
        </nav>
      </div>

      <div className="user-profile">
        <div className="avatar">AJ</div>
        <div className="user-info">
          <span className="user-name">Alex Johnson</span>
          <span className="user-class">Class of 2027</span>
        </div>
      </div>
    </div>
  );
}
