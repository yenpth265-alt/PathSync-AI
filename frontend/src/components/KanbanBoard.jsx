import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';

import KanbanCard from './KanbanCard';
import { fetchApplications, moveApplication } from '../services/api';
import './KanbanBoard.css';
import SortableCard from './SortableCard';

export default function KanbanBoard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    const handleUpdate = () => loadData();
    window.addEventListener('appDataUpdated', handleUpdate);
    return () => window.removeEventListener('appDataUpdated', handleUpdate);
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

  const handleDragStart = (event) => {
    const { active } = event;
    const activeApp = applications.find(app => app.id === active.id);
    setActiveCard(activeApp);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;

    // Check if dragging over a column directly or over another card
    const isActiveCard = active.data.current?.type === 'Card';
    const isOverCard = over.data.current?.type === 'Card';
    const isOverColumn = over.data.current?.type === 'Column';
    
    if (!isActiveCard) return;

    // Dropping a card over another card
    if (isActiveCard && isOverCard) {
      setApplications(prev => {
        const activeIndex = prev.findIndex(app => app.id === activeId);
        const overIndex = prev.findIndex(app => app.id === overId);
        
        if (prev[activeIndex].column !== prev[overIndex].column) {
          const updated = [...prev];
          updated[activeIndex].column = prev[overIndex].column;
          return arrayMove(updated, activeIndex, overIndex);
        }
        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Dropping a card over an empty column area
    if (isActiveCard && isOverColumn) {
      setApplications(prev => {
        const activeIndex = prev.findIndex(app => app.id === activeId);
        const updated = [...prev];
        updated[activeIndex].column = overId;
        return arrayMove(updated, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeApp = applications.find(app => app.id === active.id);
    if (activeApp) {
      try {
        await moveApplication(activeApp.id, activeApp.column);
      } catch (error) {
        console.error("Failed to move application on server", error);
        loadData(); // Revert on failure
      }
    }
  };

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

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {columns.map(col => {
            const columnCards = getCardsByColumn(col.id);
            return (
              <KanbanColumn 
                key={col.id} 
                col={col} 
                cards={columnCards} 
                onUpdate={loadData} 
              />
            );
          })}
        </div>
        
        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} isOverlay={true} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// KanbanColumn as an internal component for Droppable Area
import { useDroppable } from '@dnd-kit/core';

function KanbanColumn({ col, cards, onUpdate }) {
  const { setNodeRef } = useDroppable({
    id: col.id,
    data: { type: 'Column', column: col }
  });

  return (
    <div className="kanban-column" ref={setNodeRef}>
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
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <SortableCard key={card.id} card={card} onUpdate={onUpdate} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px', border: '1px dashed #cbd5e1', borderRadius: '8px'}}>
            Kéo thả hồ sơ vào đây
          </div>
        )}
      </div>
    </div>
  );
}
