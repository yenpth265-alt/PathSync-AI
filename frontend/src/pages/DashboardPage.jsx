import React from 'react';
import './DashboardPage.css';
import { Target, TrendingUp, Clock, BookOpen, ChevronRight, Award } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Welcome back, Alex! 👋</h1>
          <p className="page-subtitle">Here is what's happening with your applications today.</p>
        </div>
      </header>

      <div className="bento-grid">
        <div className="bento-item highlight-card">
          <div className="highlight-content">
            <span className="highlight-tag">Next Deadline</span>
            <h2>Submit IELTS Result</h2>
            <p>Harvard University - Early Action</p>
            <div className="time-left">
              <Clock size={16} />
              <span>12 days left</span>
            </div>
          </div>
          <div className="highlight-icon">
            <Target size={48} />
          </div>
        </div>

        <div className="bento-item stat-card">
          <div className="stat-icon-wrapper blue">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h3>3</h3>
            <p>Target Schools</p>
          </div>
        </div>

        <div className="bento-item stat-card">
          <div className="stat-icon-wrapper purple">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>65%</h3>
            <p>Overall Readiness</p>
          </div>
        </div>

        <div className="bento-item large-card">
          <div className="card-header">
            <h3>Recent Activities</h3>
            <button className="btn-link">View All <ChevronRight size={16} /></button>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot green"></div>
              <div className="activity-text">
                <p><strong>Completed:</strong> Request Letter of Recommendation</p>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot blue"></div>
              <div className="activity-text">
                <p><strong>Added:</strong> New application for MIT</p>
                <span>Yesterday</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot yellow"></div>
              <div className="activity-text">
                <p><strong>Pending:</strong> Draft Personal Statement</p>
                <span>3 days ago</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bento-item action-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn">
              <BookOpen size={20} />
              <span>Review Essay</span>
            </button>
            <button className="quick-action-btn">
              <Target size={20} />
              <span>Find Match</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
