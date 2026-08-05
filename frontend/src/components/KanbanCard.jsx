import React from 'react';
import { Calendar, CheckSquare, Check, Trash2 } from 'lucide-react';
import { toggleTask, deleteApplication } from '../services/api';
import './KanbanCard.css';

export default function KanbanCard({ card, onUpdate, isOverlay }) {
  const getBadgeClass = (status) => {
    switch(status) {
      case 'Urgent': return 'badge-urgent';
      case 'Soon': return 'badge-soon';
      case 'On Track': return 'badge-ontrack';
      default: return '';
    }
  };

  const handleToggleTask = async (taskId, currentCompleted, e) => {
    e.stopPropagation(); // Prevent drag event
    try {
      await toggleTask(taskId, !currentCompleted);
      if (onUpdate) onUpdate(); // Refresh the board data
    } catch (error) {
      console.error("Failed to toggle task", error);
    }
  };

  const handleDeleteApp = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete application for ${card.university}?`)) {
      try {
        await deleteApplication(card.id);
        if (onUpdate) onUpdate();
      } catch (err) {
        console.error("Failed to delete application", err);
      }
    }
  };

  // Add extra classes if this is being dragged (overlay mode)
  const cardClass = `kanban-card ${isOverlay ? 'dragging-overlay' : ''}`;

  return (
    <div className={cardClass} onClick={() => window.dispatchEvent(new CustomEvent('openAppDetails', { detail: card }))}>
      <div className="card-header">
        <span className="card-location">{card.location}</span>
        <button 
          className="btn-icon" 
          title="Delete Application"
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={handleDeleteApp}
          style={{ color: '#ef4444', cursor: 'pointer', background: 'transparent', border: 'none' }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      
      <h3 className="card-title">{card.university}</h3>
      <p className="card-subtitle">{card.type === 'Regular Decision' ? 'Kỳ nộp chính (RD)' : card.type === 'Early Decision' ? 'Kỳ nộp sớm (ED)' : card.type}</p>
      
      <div className="card-meta">
        <div className="card-deadline">
          <Calendar size={14} />
          <span>Hạn nộp: {card.deadline}</span>
        </div>
      </div>
      
      <div className="card-progress">
        <div className="progress-header">
          <span>Tiến độ</span>
          <span>{card.progress}/{card.totalTasks} nhiệm vụ</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: card.totalTasks > 0 ? `${(card.progress / card.totalTasks) * 100}%` : '0%' }}
          ></div>
        </div>
      </div>
      
      <div className="card-subtasks" onPointerDown={(e) => e.stopPropagation()}>
        <div className="subtasks-header">
          <span>Hạng mục công việc</span>
          <button className="btn-icon-small"><CheckSquare size={14} /></button>
        </div>
        
        <ul className="subtasks-list">
          {card.subtasks && card.subtasks.map(task => {
            let taskTitleVi = task.title;
            if (task.title === 'Draft Personal Statement') taskTitleVi = 'Soạn bài luận cá nhân (SOP)';
            if (task.title === 'Request Letters of Recommendation') taskTitleVi = 'Xin thư giới thiệu (LOR)';
            if (task.title === 'Submit Transcripts') taskTitleVi = 'Nộp bảng điểm học tập';
            
            let taskDateVi = task.date;
            if (task.date === 'No Date') taskDateVi = 'Chưa xếp ngày';

            const handleSubtaskClick = (e) => {
              e.stopPropagation();
              if (task.title.includes('Personal Statement') || task.title.includes('SOP') || task.title.includes('Soạn bài luận')) {
                window.dispatchEvent(new CustomEvent('openAppDetails', { detail: card }));
              } else if (task.title.includes('Letters of Recommendation') || task.title.includes('LOR') || task.title.includes('thư giới thiệu')) {
                toast('✉️ Hạng mục LOR: Vui lòng liên hệ Thầy cô / Quản lý của bạn để yêu cầu Thư giới thiệu chính thức.', { icon: '📝' });
              } else if (task.title.includes('Transcripts') || task.title.includes('bảng điểm')) {
                toast('📂 Chuyển hướng đến Quản lý Tài Liệu để tải bảng điểm dịch thuật...', { icon: '📄' });
                setTimeout(() => { window.location.href = '/documents'; }, 1000);
              }
            };

            return (
              <li key={task.id} className={`subtask-item ${task.completed ? 'completed' : ''}`}>
                <div 
                  className="subtask-checkbox" 
                  onClick={(e) => handleToggleTask(task.id, task.completed, e)}
                  style={{ cursor: 'pointer' }}
                >
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </div>
                <div className="subtask-content" onClick={handleSubtaskClick} style={{ cursor: 'pointer' }}>
                  <span className="subtask-title">{taskTitleVi}</span>
                  <div className="subtask-meta">
                    <Calendar size={12} />
                    <span>{taskDateVi}</span>
                    <span className={`status-dot ${getBadgeClass(task.status)}`}></span>
                    <span className={`status-text ${getBadgeClass(task.status)}`}>{task.status === 'On Track' ? 'Đúng hạn' : task.status === 'Soon' ? 'Sắp tới' : task.status === 'Urgent' ? 'Gấp' : task.status}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
