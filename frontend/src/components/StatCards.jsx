import React from 'react';
import { Activity, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import './StatCards.css';
import { mockStats } from '../data/mockData';

export default function StatCards() {
  return (
    <div className="stat-cards">
      <div className="stat-card">
        <div className="stat-icon-wrapper bg-blue">
          <Activity size={20} className="text-blue" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{mockStats.total}</span>
          <span className="stat-label">Total Applications</span>
          <span className="stat-trend">+2 this month</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon-wrapper bg-gray">
          <Clock size={20} className="text-gray" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{mockStats.inProgress}</span>
          <span className="stat-label">In Progress</span>
          <span className="stat-trend text-gray">Active right now</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon-wrapper bg-green">
          <CheckCircle2 size={20} className="text-green" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{mockStats.completed}</span>
          <span className="stat-label">Completed</span>
          <span className="stat-trend text-gray">This cycle</span>
        </div>
      </div>
      
      <div className="stat-card border-danger">
        <div className="stat-icon-wrapper bg-red">
          <AlertCircle size={20} className="text-red" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{mockStats.urgent}</span>
          <span className="stat-label">Urgent Deadlines</span>
          <span className="stat-trend text-gray">Due within 2 weeks</span>
        </div>
      </div>
    </div>
  );
}
