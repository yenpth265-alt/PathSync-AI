import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import { Target, TrendingUp, Clock, BookOpen, Award, BarChart2, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { getDashboardMetrics } from '../services/api';

export default function DashboardPage({ lang = 'vi' }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showCharts, setShowCharts] = useState(false);
  const [metrics, setMetrics] = useState(null);
  
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : (profile?.name ? profile.name.split(' ')[0] : 'Guest');
  const isProfileIncomplete = !profile?.onboarding_done;

  useEffect(() => {
    const fetchMetrics = async () => {
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
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
    { name: lang === 'vi' ? 'Đã xong' : 'Completed', value: metrics.task_status.completed, color: '#22c55e' },
    { name: lang === 'vi' ? 'Đang làm' : 'In Progress', value: metrics.task_status.in_progress, color: '#3b82f6' },
    { name: lang === 'vi' ? 'Cần làm' : 'To Do', value: metrics.task_status.todo, color: '#94a3b8' },
  ] : [];

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">{lang === 'vi' ? `Chào mừng trở lại, ${firstName}!` : `Welcome back, ${firstName}!`} 👋</h1>
          <p className="page-subtitle">{lang === 'vi' ? 'Đây là tổng quan lộ trình ứng tuyển của bạn hôm nay.' : 'Here is an overview of your application journey today.'}</p>
        </div>
      </header>

      {isProfileIncomplete && (
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '4px' }}>{lang === 'vi' ? 'Hoàn thiện hồ sơ để nhận gợi ý cá nhân hóa' : 'Complete your profile for personalized suggestions'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{lang === 'vi' ? 'Chúng mình nhận thấy hồ sơ của bạn còn thiếu vài thông tin. Hồ sơ đầy đủ sẽ giúp AI tìm kiếm học bổng và trường phù hợp nhất.' : 'We noticed your profile is missing some info. A complete profile helps AI find the best scholarships and universities for you.'}</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>{lang === 'vi' ? 'Cập nhật ngay' : 'Update Now'}</button>
        </div>
      )}

      <div className="bento-grid">
        <div className="bento-item highlight-card">
          <div className="highlight-content">
            <span className="highlight-tag">{lang === 'vi' ? 'Hạn chót sắp tới' : 'Upcoming Deadline'}</span>
            {metrics?.next_deadline ? (
              <>
                <h2>{metrics.next_deadline.type}</h2>
                <p>{metrics.next_deadline.university}</p>
                <div className="time-left">
                  <Clock size={16} />
                  <span>{lang === 'vi' ? `Còn ${metrics.next_deadline.days_left} ngày` : `${metrics.next_deadline.days_left} days left`}</span>
                </div>
              </>
            ) : (
              <>
                <h2>{lang === 'vi' ? 'Không có hạn chót nào' : 'No upcoming deadlines'}</h2>
                <p>{lang === 'vi' ? 'Bạn đã hoàn thành mọi mục tiêu trước mắt!' : 'You have completed all immediate goals!'}</p>
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
            <p>{lang === 'vi' ? 'Trường mục tiêu' : 'Target Universities'}</p>
          </div>
        </div>

        <div className="bento-item stat-card">
          <div className="stat-icon-wrapper purple">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>{metrics ? metrics.overall_readiness : 0}%</h3>
            <p>{lang === 'vi' ? 'Mức độ sẵn sàng' : 'Readiness Score'}</p>
          </div>
        </div>

        <div className="bento-item large-card chart-card">
          <div className="card-header">
            <h3>{lang === 'vi' ? 'Tiến độ Lộ trình' : 'Journey Progress'}</h3>
            <button className="btn-icon-small" onClick={() => setShowCharts(!showCharts)} title={lang === 'vi' ? 'Chuyển đổi góc nhìn' : 'Toggle view'}>
              <BarChart2 size={16} color={showCharts ? 'var(--primary)' : 'var(--text-muted)'} />
            </button>
          </div>
          <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!showCharts ? (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '48px', fontWeight: '800', color: 'var(--text-main)' }}>{metrics ? metrics.overall_readiness : 0}%</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>{lang === 'vi' ? 'Tiến độ hiện tại' : 'Current Progress'}</p>
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
            <h3>{lang === 'vi' ? 'Trạng thái Công việc' : 'Task Status'}</h3>
            <button className="btn-icon-small" onClick={() => setShowCharts(!showCharts)} title={lang === 'vi' ? 'Chuyển đổi góc nhìn' : 'Toggle view'}>
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
            <h3>{lang === 'vi' ? 'Hoạt động gần đây' : 'Recent Activity'}</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {metrics?.recent_activity?.length ? metrics.recent_activity.map((act, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px' }}></div>
                  {i !== metrics.recent_activity.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border-color)', margin: '4px 0' }}></div>}
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>{act.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{act.status}</p>
                </div>
              </div>
            )) : <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Chưa có hoạt động nào.' : 'No recent activity.'}</p>}
          </div>
        </div>

        <div className="bento-item action-card">
          <div className="card-header">
            <h3>{lang === 'vi' ? 'Hành động nhanh' : 'Quick Actions'}</h3>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate('/explore')}>
              <Target size={20} />
              <span>{lang === 'vi' ? 'Khám phá Trường' : 'Explore Unis'}</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/persona-lab')}>
              <Brain size={20} />
              <span>{lang === 'vi' ? 'Cố vấn AI' : 'AI Mentor'}</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/applications')}>
              <BookOpen size={20} />
              <span>{lang === 'vi' ? 'Cập nhật Hồ sơ' : 'Update Profile'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
