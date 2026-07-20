import React from 'react';
import './DashboardPage.css';
import { Target, TrendingUp, Clock, BookOpen, ChevronRight, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const progressData = [
  { name: 'Jan', progress: 10 },
  { name: 'Feb', progress: 20 },
  { name: 'Mar', progress: 35 },
  { name: 'Apr', progress: 45 },
  { name: 'May', progress: 65 },
  { name: 'Jun', progress: 80 },
];

const statusData = [
  { name: 'Completed', value: 12, color: '#22c55e' },
  { name: 'In Progress', value: 8, color: '#3b82f6' },
  { name: 'To Do', value: 5, color: '#94a3b8' },
];

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

        <div className="bento-item large-card chart-card">
          <div className="card-header">
            <h3>Readiness Over Time</h3>
          </div>
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer>
              <AreaChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)', background: 'var(--card-bg)' }}
                  itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="progress" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento-item chart-card">
          <div className="card-header">
            <h3>Task Status</h3>
          </div>
          <div style={{ width: '100%', height: '160px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)', background: 'var(--card-bg)' }}
                  itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
            {statusData.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
                {item.name}
              </div>
            ))}
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
