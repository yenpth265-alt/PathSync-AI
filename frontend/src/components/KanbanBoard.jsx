import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Sparkles, FileText, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
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
import { fetchApplications, moveApplication, createApplication, extractActionsFromDocument } from '../services/api';
import './KanbanBoard.css';
import SortableCard from './SortableCard';

export default function KanbanBoard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null);
  const [showExtractorModal, setShowExtractorModal] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState(null);
  const [fileName, setFileName] = useState('Harvard_Brochure_2026.pdf');

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
    { id: 'todo', title: 'Cần làm', count: todoCount, icon: <div className="col-indicator bg-gray">{todoCount}</div> },
    { id: 'inprogress', title: 'Đang xử lý', count: inProgressCount, icon: <div className="col-indicator bg-blue">{inProgressCount}</div> },
    { id: 'completed', title: 'Hoàn thành', count: completedCount, icon: <div className="col-indicator bg-green">{completedCount}</div> }
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
    return <div className="kanban-container" style={{justifyContent: 'center', alignItems: 'center'}}>Đang tải dữ liệu...</div>;
  }

  const handleRunActionExtractor = async () => {
    setExtracting(true);
    try {
      const res = await extractActionsFromDocument(fileName);
      setExtractedTasks(res);
      toast.success('🎉 AI đã bóc tách thành công 4 mốc deadline & yêu cầu hồ sơ!');
    } catch {
      toast.error('Lỗi khi bóc tách file PDF');
    } finally {
      setExtracting(false);
    }
  };

  const handleImportTasksToKanban = async () => {
    if (!extractedTasks) return;
    try {
      for (const t of extractedTasks) {
        await createApplication({
          university: t.title,
          deadline: t.deadline,
          type: 'Action Extractor PDF'
        });
      }
      toast.success('🚀 Đã tự động khởi tạo các công việc vào Kanban Board!');
      setShowExtractorModal(false);
      setExtractedTasks(null);
      loadData();
    } catch {
      toast.error('Không thể tự động thêm vào Kanban');
    }
  };

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h2 className="board-title">Tiến Độ Ứng Tuyển Du Học</h2>
        <span className="board-subtitle">Smart AI Tracking</span>

        <button 
          onClick={() => setShowExtractorModal(true)} 
          className="btn btn-primary" 
          style={{ marginLeft: '20px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Sparkles size={16} /> ⚡ AI Action Extractor (Bóc tách PDF)
        </button>
        
        <div className="board-legend">
          <span className="legend-item"><span className="status-dot badge-urgent"></span>Gấp</span>
          <span className="legend-item"><span className="status-dot badge-soon"></span>Sắp tới</span>
          <span className="legend-item"><span className="status-dot badge-ontrack"></span>Đúng hạn</span>
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

      {/* ACTION EXTRACTOR MODAL */}
      {showExtractorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-main)', padding: '28px', borderRadius: '24px', width: '100%', maxWidth: '650px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#3b82f6" /> AI Action Extractor (Bóc Tách Deadline PDF)
              </h3>
              <button onClick={() => setShowExtractorModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <XCircle size={24} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Tải lên hoặc chọn file Brochure / Thông báo tuyển sinh PDF của trường. AI sẽ tự động đọc, phân tích và trích xuất các mốc thời hạn & danh mục hồ sơ cần nộp.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <select 
                value={fileName} 
                onChange={e => setFileName(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
              >
                <option value="Harvard_Brochure_2026.pdf">📄 Harvard_Brochure_2026.pdf (Thông báo Tuyển sinh)</option>
                <option value="MIT_Scholarships_Guide.pdf">📄 MIT_Scholarships_Guide.pdf (Hướng dẫn Học bổng)</option>
                <option value="NUS_Admission_Requirements.pdf">📄 NUS_Admission_Requirements.pdf (Yêu cầu Đầu vào NUS)</option>
              </select>
              <button 
                onClick={handleRunActionExtractor} 
                disabled={extracting}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
              >
                {extracting ? 'AI Đang Đọc & Quét PDF...' : 'Quét & Bóc Tách'}
              </button>
            </div>

            {extractedTasks && (
              <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> Các mốc deadline & công việc AI trích xuất được:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {extractedTasks.map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{t.title}</span>
                      <span style={{ color: '#ef4444', fontWeight: '700' }}>🗓️ Hạn: {t.deadline}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {extractedTasks && (
                <button onClick={handleImportTasksToKanban} className="btn btn-primary" style={{ background: '#10b981' }}>
                  🚀 Đẩy Tất Cả Vào Kanban Board
                </button>
              )}
              <button onClick={() => setShowExtractorModal(false)} className="btn">Đóng</button>
            </div>
          </div>
        </div>
      )}
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
          <span className="column-count">{col.count} hồ sơ</span>
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
