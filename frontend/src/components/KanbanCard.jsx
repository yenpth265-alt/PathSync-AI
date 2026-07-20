import React from 'react';
import { Calendar, MoreHorizontal, CheckSquare, Check, X } from 'lucide-react';
import './KanbanCard.css';

export default function KanbanCard({ card }) {
  const getBadgeClass = (status) => {
    switch(status) {
      case 'Urgent': return 'badge-urgent';
      case 'Soon': return 'badge-soon';
      case 'On Track': return 'badge-ontrack';
      default: return '';
    }
  };

  return (
    <div className="kanban-card">
      <div className="card-header">
        <span className="card-location">{card.location}</span>
        <button className="btn-icon"><MoreHorizontal size={16} /></button>
      </div>
      
      <h3 className="card-title">{card.university}</h3>
      <p className="card-subtitle">{card.type}</p>
      
      <div className="card-meta">
        <div className="card-deadline">
          <Calendar size={14} />
          <span>Deadline: {card.deadline}</span>
        </div>
      </div>
      
      <div className="card-progress">
        <div className="progress-header">
          <span>Progress</span>
          <span>{card.progress}/{card.totalTasks} tasks</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(card.progress / card.totalTasks) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="card-subtasks">
        <div className="subtasks-header">
          <span>Sub-tasks</span>
          <button className="btn-icon-small"><CheckSquare size={14} /></button>
        </div>
        
        <ul className="subtasks-list">
          {card.subtasks.map(task => (
            <li key={task.id} className={`subtask-item ${task.completed ? 'completed' : ''}`}>
              <div className="subtask-checkbox">
                {task.completed && <Check size={12} />}
              </div>
              <div className="subtask-content">
                <span className="subtask-title">{task.title}</span>
                <div className="subtask-meta">
                  <Calendar size={12} />
                  <span>{task.date}</span>
                  <span className={`status-dot ${getBadgeClass(task.status)}`}></span>
                  <span className={`status-text ${getBadgeClass(task.status)}`}>{task.status}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
