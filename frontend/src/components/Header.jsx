import React, { useState } from 'react';
import { Calendar, Filter, ArrowUpDown, Plus } from 'lucide-react';
import { createApplication } from '../services/api';
import Modal from './ui/Modal';
import './Header.css';

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    university: '',
    location: 'US United States',
    type: 'Regular Decision',
    deadline: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNewApplication = async (e) => {
    e.preventDefault();
    try {
      const newApp = await createApplication({
        column: 'todo',
        university: formData.university || 'Unknown University',
        location: formData.location,
        type: formData.type,
        deadline: formData.deadline || 'Jan 1, 2027',
        progress: 0,
        totalTasks: 0
      });
      
      setIsModalOpen(false);
      window.dispatchEvent(new Event('appDataUpdated'));
    } catch (error) {
      console.error('Error creating application:', error);
    }
  };

  return (
    <>
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
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            New Application
          </button>
        </div>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Create New Application"
      >
        <form onSubmit={handleNewApplication}>
          <div className="form-group">
            <label className="form-label">University Name</label>
            <input 
              type="text" 
              name="university"
              className="form-input" 
              placeholder="e.g. Harvard University"
              value={formData.university}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Country / Location</label>
            <input 
              type="text" 
              name="location"
              className="form-input" 
              placeholder="e.g. US United States"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Application Type</label>
            <select name="type" className="form-select" value={formData.type} onChange={handleChange}>
              <option>Early Decision</option>
              <option>Early Action</option>
              <option>Regular Decision</option>
              <option>Rolling Admission</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input 
              type="text" 
              name="deadline"
              className="form-input" 
              placeholder="e.g. Jan 1, 2027"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
