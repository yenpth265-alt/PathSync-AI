import React from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import KanbanCard from './KanbanCard';
import { mockKanbanData } from '../data/mockData';
import './KanbanBoard.css';

export default function KanbanBoard() {
  const getCardsByColumn = (columnId) => {
    return mockKanbanData.filter(card => card.column === columnId);
  };

  const columns = [
    { id: 'todo', title: 'To Do', count: 3, icon: <div className="col-indicator bg-gray">3</div> },
    { id: 'inprogress', title: 'In Progress', count: 3, icon: <div className="col-indicator bg-blue">3</div> },
    { id: 'completed', title: 'Completed', count: 2, icon: <div className="col-indicator bg-green">2</div> }
  ];

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h2 className="board-title">Checklist Board</h2>
        <span className="board-subtitle">8 applications</span>
        
        <div className="board-legend">
          <span className="legend-item"><span className="status-dot badge-urgent"></span>Urgent</span>
          <span className="legend-item"><span className="status-dot badge-soon"></span>Soon</span>
          <span className="legend-item"><span className="status-dot badge-ontrack"></span>On Track</span>
        </div>
      </div>

      <div className="kanban-board">
        {columns.map(col => (
          <div key={col.id} className="kanban-column">
            <div className="column-header">
              <div className="column-title-wrap">
                {col.icon}
                <h3 className="column-title">{col.title}</h3>
                <span className="column-count">{col.count} cards</span>
              </div>
              <div className="column-actions">
                <button className="btn-icon"><Plus size={16} /></button>
                <button className="btn-icon"><MoreHorizontal size={16} /></button>
              </div>
            </div>
            
            <div className="column-content">
              {getCardsByColumn(col.id).map(card => (
                <KanbanCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
