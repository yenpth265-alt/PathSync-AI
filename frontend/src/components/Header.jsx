import React, { useState, useEffect } from 'react';
import { Plus, Mail, MessageSquare, X } from 'lucide-react';
import { createApplication, getBookings } from '../services/api';
import Modal from './ui/Modal';
import './Header.css';

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [formData, setFormData] = useState({
    university: '',
    location: '',
    type: 'Regular Decision',
    deadline: ''
  });

  const loadInbox = async () => {
    try {
      const res = await getBookings();
      setInboxMessages(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setInboxMessages([]);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNewApplication = async (e) => {
    e.preventDefault();
    try {
      await createApplication({
        university: formData.university || 'Unknown University',
        country: formData.location,
        type: formData.type,
        deadline: formData.deadline || 'Jan 1, 2027'
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
          <h1 className="page-title">Bảng Quản Lý Hồ Sơ</h1>
          <div className="breadcrumbs">
            <span>Tổng Quan</span>
            <span className="separator">&gt;</span>
            <span>Quản Lý Hồ Sơ</span>
            <span className="separator">&gt;</span>
            <span className="current">Giao diện Kanban</span>
          </div>
        </div>
        
        <div className="header-right">
          <button className="btn btn-outline" onClick={() => { setIsInboxOpen(true); loadInbox(); }} style={{ position: 'relative' }}>
            <Mail size={16} />
            Hộp Thư Cố Vấn
            {inboxMessages.length > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                {inboxMessages.length}
              </span>
            )}
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Thêm Hồ Sơ Mới
          </button>
        </div>
      </header>

      {/* Student Mentor Inbox Modal */}
      {isInboxOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-color)', width: '100%', maxWidth: '650px', borderRadius: '24px', padding: '24px', maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-premium)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', pb: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare color="#3b82f6" />
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>Hộp Thư Lời Nhắn Từ Cố Vấn</h2>
              </div>
              <button className="btn-icon" onClick={() => setIsInboxOpen(false)}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inboxMessages.length > 0 ? (
                inboxMessages.map((msg, idx) => (
                  <div key={idx} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>Cố vấn: {msg.mentor_name || 'Nguyễn Minh Anh'}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{msg.slot_time}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                      {msg.mentor_feedback || msg.ai_pre_feedback || 'Xin chào bạn! Cố vấn đã tiếp nhận hồ sơ và sẽ gặp bạn đúng khung giờ đặt lịch.'}
                    </p>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                      ● Trạng thái: {msg.status === 'confirmed' ? 'Đã xác nhận buổi tư vấn' : msg.status === 'completed' ? 'Đã hoàn thành' : 'Đang chờ xử lý'}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '14px', margin: 0 }}>Lời nhắn mẫu từ Cố vấn Nguyễn Minh Anh (Harvard Alumni):</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '8px' }}>
                    "Chào bạn! Bài luận SOP của bạn về ngành Computer Science có ý tưởng rất sáng tạo. Hẹn gặp bạn ở buổi tư vấn Online tới!"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
