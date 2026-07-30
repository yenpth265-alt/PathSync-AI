import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import './StatCards.css';
import { getDashboardMetrics } from '../services/api';

export default function StatCards() {
  const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0, urgent: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardMetrics();
        const data = await response.json();
        if (data && data.task_status) {
          setStats({
            total: data.task_status.todo + data.task_status.in_progress + data.task_status.completed,
            inProgress: data.task_status.in_progress,
            completed: data.task_status.completed,
            urgent: data.next_deadline ? 1 : 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch stat cards", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="stat-cards">
      <div className="stat-card">
        <div className="stat-icon-wrapper bg-blue">
          <Activity size={20} className="text-blue" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Tổng hồ sơ</span>
          <span className="stat-trend">Trên hệ thống</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon-wrapper bg-gray">
          <Clock size={20} className="text-gray" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{stats.inProgress}</span>
          <span className="stat-label">Đang xử lý</span>
          <span className="stat-trend text-gray">Cần hoàn thiện</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon-wrapper bg-green">
          <CheckCircle2 size={20} className="text-green" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{stats.completed}</span>
          <span className="stat-label">Đã hoàn thành</span>
          <span className="stat-trend text-gray">Sẵn sàng nộp</span>
        </div>
      </div>
      
      <div className="stat-card border-danger">
        <div className="stat-icon-wrapper bg-red">
          <AlertCircle size={20} className="text-red" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{stats.urgent}</span>
          <span className="stat-label">Hạn chót gấp</span>
          <span className="stat-trend text-gray">Cần chú ý</span>
        </div>
      </div>
    </div>
  );
}
