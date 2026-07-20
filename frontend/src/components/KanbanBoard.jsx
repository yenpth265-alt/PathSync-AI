import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import KanbanCard from './KanbanCard';
import { fetchApplications } from '../services/api';
import './KanbanBoard.css';

export default function KanbanBoard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await fetchApplications();
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listen for custom event to reload data
    const handleUpdate = () => {
      loadData();
    };
    
    window.addEventListener('appDataUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('appDataUpdated', handleUpdate);
    };
  }, []);

  const getCardsByColumn = (columnId) => {
    return applications.filter(card => card.column === columnId);
  };

  const todoCount = getCardsByColumn('todo').length;
  const inProgressCount = getCardsByColumn('inprogress').length;
  const completedCount = getCardsByColumn('completed').length;

  const columns = [
    { id: 'todo', title: 'To Do', count: todoCount, icon: <div className="col-indicator bg-gray">{todoCount}</div> },
    { id: 'inprogress', title: 'In Progress', count: inProgressCount, icon: <div className="col-indicator bg-blue">{inProgressCount}</div> },
    { id: 'completed', title: 'Completed', count: completedCount, icon: <div className="col-indicator bg-green">{completedCount}</div> }
  ];

  if (loading) {
    return <div className="kanban-container" style={{justifyContent: 'center', alignItems: 'center'}}>Loading data...</div>;
  }

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h2 className="board-title">Checklist Board</h2>
        <span className="board-subtitle">{applications.length} applications</span>
        
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
                <KanbanCard key={card.id} card={card} onUpdate={loadData} />
              ))}
              {getCardsByColumn(col.id).length === 0 && (
                <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px'}}>No applications here</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
