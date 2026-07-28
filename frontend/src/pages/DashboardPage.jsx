import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import { Target, TrendingUp, Clock, BookOpen, ChevronRight, Award, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getCurrentUser, getAuthToken } from '../utils/auth';

export default function DashboardPage() {
  const [showCharts, setShowCharts] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const user = getCurrentUser();
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Guest';

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch('http://localhost:8000/api/v1/applications/metrics', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      }
    };
    fetchMetrics();
  }, []);

  const progressData = [
    { name: 'Current', progress: metrics ? metrics.overall_readiness : 0 },
  ];

  const statusData = metrics ? [
    { name: 'Completed', value: metrics.task_status.completed, color: '#22c55e' },
    { name: 'In Progress', value: metrics.task_status.in_progress, color: '#3b82f6' },
    { name: 'To Do', value: metrics.task_status.todo, color: '#94a3b8' },
  ] : [];

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {firstName}! 👋</h1>
          <p className="page-subtitle">Here is what's happening with your applications today.</p>
        </div>
      </header>

      <div className="bento-grid">
        <div className="bento-item highlight-card">
          <div className="highlight-content">
            <span className="highlight-tag">Next Deadline</span>
            {metrics?.next_deadline ? (
              <>
                <h2>{metrics.next_deadline.type}</h2>
                <p>{metrics.next_deadline.university}</p>
                <div className="time-left">
                  <Clock size={16} />
                  <span>{metrics.next_deadline.days_left} days left</span>
                </div>
              </>
            ) : (
              <>
                <h2>No upcoming deadlines</h2>
                <p>You're all caught up!</p>
              </>
            )}
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
            <h3>{metrics ? metrics.target_schools : 0}</h3>
            <p>Target Schools</p>
          </div>
        </div>

        <div className="bento-item stat-card">
          <div className="stat-icon-wrapper purple">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>{metrics ? metrics.overall_readiness : 0}%</h3>
            <p>Overall Readiness</p>
          </div>
        </div>

        <div className="bento-item large-card chart-card">
          <div className="card-header">
            <h3>Readiness Over Time</h3>
            <button className="btn-icon-small" onClick={() => setShowCharts(!showCharts)} title="Toggle Chart View">
              <BarChart2 size={16} color={showCharts ? 'var(--primary)' : 'var(--text-muted)'} />
            </button>
          </div>
          <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!showCharts ? (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '48px', fontWeight: '800', color: 'var(--text-main)' }}>{metrics ? metrics.overall_readiness : 0}%</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Current Readiness</p>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        <div className="bento-item chart-card">
          <div className="card-header">
            <h3>Task Status</h3>
            <button className="btn-icon-small" onClick={() => setShowCharts(!showCharts)} title="Toggle Chart View">
              <BarChart2 size={16} color={showCharts ? 'var(--primary)' : 'var(--text-muted)'} />
            </button>
          </div>
          <div style={{ width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!showCharts ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                {statusData.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}
          </div>
          {showCharts && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
              {statusData.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
                  {item.name}
                </div>
              ))}
            </div>
          )}
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
