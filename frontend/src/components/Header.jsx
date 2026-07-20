import React from 'react';
import { Calendar, Filter, ArrowUpDown, Plus } from 'lucide-react';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="page-title">Application Board</h1>
        <div className="breadcrumbs">
          <span>Dashboard</span>
          <span className="separator">&gt;</span>
          <span>Applications</span>
          <span className="separator">&gt;</span>
          <span className="current">Kanban View</span>
        </div>
      </div>
      
      <div className="header-right">
        <button className="btn btn-outline date-picker">
          <Calendar size={16} />
          Jul 2026
        </button>
        <button className="btn btn-outline">
          <Filter size={16} />
          Filter
        </button>
        <button className="btn btn-outline">
          <ArrowUpDown size={16} />
          Sort
        </button>
        <button className="btn btn-primary">
          <Plus size={16} />
          New Application
        </button>
      </div>
    </header>
  );
}
