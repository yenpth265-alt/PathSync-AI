import React from 'react';
import { Calendar, Filter, ArrowUpDown, Plus } from 'lucide-react';
import { createApplication, createTask } from '../services/api';
import './Header.css';

export default function Header() {
  const handleNewApplication = async () => {
    try {
      const newApp = await createApplication({
        column: 'todo',
        university: 'MIT',
        location: 'US United States',
        type: 'Regular Decision',
        deadline: 'Jan 1, 2027',
        progress: 0,
        totalTasks: 0
      });
      
      // Add a dummy task as well
      if (newApp && newApp.id) {
        await createTask({
          application_id: newApp.id,
          title: 'Fill out online application form',
          date: 'Dec 15, 2026',
          status: 'On Track',
          completed: false
        });
      }
      
      window.dispatchEvent(new Event('appDataUpdated'));
    } catch (error) {
      console.error('Error creating application:', error);
    }
  };

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
        <button className="btn btn-primary" onClick={handleNewApplication}>
          <Plus size={16} />
          New Application
        </button>
      </div>
    </header>
  );
}
