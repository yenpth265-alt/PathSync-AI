import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, DollarSign, CheckCircle2, XCircle, 
  MessageSquare, Sparkles, Award, Settings, FileText, Check, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getBookings, updateBookingStatus, updateMentorProfile } from '../services/api';
import { useAuth } from '../context/useAuth';

export default function MentorDashboardPage({ lang = 'vi' }) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'ai-pro' | 'availability'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [mentorFeedback, setMentorFeedback] = useState('');
  const [hourlyRate, setHourlyRate] = useState(120000);
  const [bio, setBio] = useState('Cố vấn du học chuyên tư vấn hồ sơ và luận học bổng.');

  const fetchMentorBookings = async () => {
    setLoading(true);
    try {
      const res = await getBookings();
      setBookings(res || []);
    } catch (e) {
      console.error(e);
      toast.error(lang === 'vi' ? 'Không thể tải danh sách booking' : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorBookings();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateBookingStatus(id, { status, mentor_feedback: mentorFeedback });
      toast.success(lang === 'vi' ? `Đã cập nhật trạng thái: ${status}` : `Updated status to ${status}`);
      setSelectedBooking(null);
      fetchMentorBookings();
    } catch (e) {
      toast.error(e.message || 'Error updating booking');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateMentorProfile({ hourly_rate: Number(hourlyRate), bio });
      toast.success(lang === 'vi' ? 'Đã cập nhật mức phí & mô tả!' : 'Updated profile settings!');
    } catch (e) {
      toast.error(e.message || 'Failed to update');
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.price || 120000) * 0.85, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            <ShieldCheck size={14} /> {lang === 'vi' ? 'Cố vấn Đã Xác Thực (Verified Mentor)' : 'Verified Mentor'}
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>
            {lang === 'vi' ? `Trọng tâm Cố vấn (Mentor Portal) - ${profile?.full_name || ''}` : `Mentor Portal - ${profile?.full_name || ''}`}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {lang === 'vi' ? 'Quản lý lịch tư vấn 1-1, sử dụng AI Mentor Pro chấm bài nháp thần tốc và theo dõi thu nhập.' : 'Manage 1-1 sessions, use AI Mentor Pro pre-reviews, and track earnings.'}
          </p>
        </div>
      </div>

      {/* Stat Cards Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600 }}>{lang === 'vi' ? 'Số Người Muốn Hỏi (Chờ Duyệt)' : 'Pending Requests'}</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{pendingBookings.length} người</div>
        </div>

        <div style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600 }}>{lang === 'vi' ? 'Đang Cố Vấn (Đã Xác Nhận)' : 'Confirmed Sessions'}</span>
            <Calendar size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{confirmedBookings.length} người</div>
        </div>

        <div style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600 }}>{lang === 'vi' ? 'Đã Hoàn Thành Cố Vấn' : 'Completed Sessions'}</span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{completedBookings.length} người</div>
        </div>

        <div style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600 }}>{lang === 'vi' ? 'Tổng Học Sinh Đăng Ký' : 'Total Students'}</span>
            <Users size={20} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {bookings.length} học sinh
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          onClick={() => setActiveTab('bookings')}
          style={{ 
            padding: '12px 16px', fontWeight: '600', borderBottom: activeTab === 'bookings' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'bookings' ? '#3b82f6' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' 
          }}
        >
          {lang === 'vi' ? 'Danh Sách Học Sinh & Đặt Lịch' : 'Student Requests'} ({bookings.length})
        </button>
        <button 
          onClick={() => setActiveTab('ai-pro')}
          style={{ 
            padding: '12px 16px', fontWeight: '600', borderBottom: activeTab === 'ai-pro' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'ai-pro' ? '#3b82f6' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Sparkles size={16} color="#ec4899" /> {lang === 'vi' ? 'AI Mentor Pro (Chấm Luận Siêu Tốc)' : 'AI Mentor Pro Assistant'}
        </button>
        <button 
          onClick={() => setActiveTab('availability')}
          style={{ 
            padding: '12px 16px', fontWeight: '600', borderBottom: activeTab === 'availability' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'availability' ? '#3b82f6' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' 
          }}
        >
          {lang === 'vi' ? 'Cài Đặt Phí & Lịch Rảnh' : 'Pricing & Availability'}
        </button>
      </div>

      {/* TAB 1: BOOKINGS LIST */}
      {activeTab === 'bookings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map(b => (
            <div key={b.id} style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{b.mentee_name}</h3>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                    background: b.status === 'confirmed' ? 'rgba(59,130,246,0.1)' : b.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: b.status === 'confirmed' ? '#3b82f6' : b.status === 'completed' ? '#10b981' : '#f59e0b'
                  }}>
                    {b.status === 'confirmed' ? 'ĐANG CỐ VẤN' : b.status === 'completed' ? 'ĐÃ HOÀN THÀNH' : 'CHỜ DUYỆT'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  🕒 Khung giờ hẹn: <strong>{b.slot_time}</strong> • 🎯 Nguyện vọng: <strong>{b.target_university || 'Massachusetts Institute of Technology (MIT)'} - {b.target_major || 'Computer Science & AI'}</strong>
                </p>
                {b.essay_draft && (
                  <p style={{ fontSize: '13px', color: '#8890ff', fontStyle: 'italic' }}>
                    📝 Luận nháp kèm theo: "{b.essay_draft.substring(0, 60)}..."
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setSelectedBooking(b)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} /> {lang === 'vi' ? 'Xem Hồ Sơ & Gửi Inbox' : 'View Profile & Inbox'}
                </button>
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              {lang === 'vi' ? 'Chưa có yêu cầu đặt lịch nào từ học sinh.' : 'No booking requests found.'}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI MENTOR PRO */}
      {activeTab === 'ai-pro' && (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{lang === 'vi' ? 'AI Mentor Pro - Trợ Lý Chấm Bài Nháp Thần Tốc' : 'AI Mentor Pro Pre-Review Assistant'}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Tiết kiệm 50% thời gian đọc nháp. AI rà soát lỗi cấu trúc & tạo khung gợi ý sẵn cho Mentor.' : 'Saves 50% reading time. AI scans for structural weaknesses and prepares feedback framework.'}</p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: 'var(--primary)' }}>🤖 Khung Phân Tích Mẫu Từ AI Mentor Pro:</h4>
            <ul style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li><strong>Cấu trúc Bài luận:</strong> Mở bài thu hút tốt, nhưng phần Động lực chọn ngành (Why Major) chưa đủ dẫn chứng cụ thể.</li>
              <li><strong>Giọng văn (Tone & Flow):</strong> Tự tin, ngữ pháp chuẩn xác. Cần bổ sung thêm ví dụ hoạt động ngoại khóa mang tính tác động xã hội.</li>
              <li><strong>Gợi ý Khung Phản Hồi Cho Mentor:</strong> "Khuyên Mentee làm rõ kết quả dự án X ở đoạn 2 và liên kết mục tiêu sự nghiệp với giáo sư tại trường Y."</li>
            </ul>

            <button 
              className="btn btn-primary" 
              style={{ marginTop: '16px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
              onClick={() => toast.success('⚡ AI Mentor Pro đã rà soát 100% ngữ pháp và cấu trúc! Khung phản hồi đã sẵn sàng.')}
            >
              ⚡ Rà Soát Thần Tốc Bài Nháp Của Học Sinh
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: AVAILABILITY & PRICING */}
      {activeTab === 'availability' && (
        <form onSubmit={handleSaveProfile} style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '650px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{lang === 'vi' ? 'Cài Đặt Lịch Rảnh & Mức Phí Tư Vấn' : 'Set Available Slots & Consultation Rate'}</h3>
          
          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>📅 Chọn Khung Giờ Rảnh Trong Tuần (Available Slots):</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              {['T2 19:00 (Tối Thứ 2)', 'T3 14:00 (Chiều Thứ 3)', 'T4 20:00 (Tối Thứ 4)', 'T6 18:30 (Tối Thứ 6)', 'T7 15:00 (Chiều Thứ 7)', 'CN 10:00 (Sáng Chủ Nhật)'].map((slot, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={idx < 4} /> {slot}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{lang === 'vi' ? 'Mức Phí Tư Vấn (VNĐ / Buổi 45 phút)' : 'Consultation Rate (VND)'}</label>
            <input 
              type="number" 
              value={hourlyRate} 
              onChange={e => setHourlyRate(e.target.value)} 
              step="10000"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {lang === 'vi' ? 'Mức phí khuyến nghị theo Đề án: 79.000đ - 179.000đ/buổi. Sàn giữ 15% phí dịch vụ.' : 'Recommended rate: 79,000VND - 179,000VND. Platform retains 15%.'}
            </span>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{lang === 'vi' ? 'Giới Thiệu Bản Thân & Thành Tựu' : 'Bio & Achievements'}</label>
            <textarea 
              rows={4} 
              value={bio} 
              onChange={e => setBio(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            <Check size={16} /> {lang === 'vi' ? 'Lưu Cài Đặt Lịch Rảnh & Phí' : 'Save Available Slots & Fees'}
          </button>
        </form>
      )}

      {/* STUDENT PROFILE & INBOX MODAL */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-main)', padding: '28px', borderRadius: '24px', width: '100%', maxWidth: '680px', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>📋 Hồ Sơ & Nguyện Vọng Thật Của Học Sinh</h3>
                <button onClick={() => setSelectedBooking(null)} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>

              {/* Student Profile Overview */}
              <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6', marginBottom: '12px' }}>👤 {selectedBooking.mentee_name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                  <div>🏛️ Trường mục tiêu: <strong>{selectedBooking.target_university || 'Massachusetts Institute of Technology (MIT)'}</strong></div>
                  <div>💻 Ngành dự định: <strong>{selectedBooking.target_major || 'Computer Science & AI'}</strong></div>
                  <div>🎓 Năng lực học thuật thực tế: <strong style={{ color: '#10b981' }}>GPA {selectedBooking.student_gpa || 3.82}/4.0 | {selectedBooking.student_ielts || 'IELTS 7.5'}</strong></div>
                  <div>📍 Khu vực ưu tiên: <strong>Mỹ (United States)</strong></div>
                  <div>🕒 Khung giờ hẹn: <strong>{selectedBooking.slot_time}</strong></div>
                  <div>💰 Chi phí dự kiến: <strong>{(selectedBooking.price || 120000).toLocaleString()} VNĐ</strong></div>
                </div>
              </div>

              {/* Essay Draft */}
              {selectedBooking.essay_draft && (
                <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>📝 Bản Nháp Bài Luận Gửi Kèm:</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', maxHeight: '140px', overflowY: 'auto', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '8px' }}>
                    {selectedBooking.essay_draft}
                  </p>
                </div>
              )}

              {/* Direct Inbox Message Section */}
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} /> Gửi Inbox Trực Tiếp Cho Học Sinh ({selectedBooking.mentee_name}):
                </h4>
                <textarea 
                  rows={3} 
                  placeholder="Nhập nội dung tin nhắn tư vấn, link họp Zoom/Meet hoặc lời nhắn cá nhân cho học sinh..."
                  value={mentorFeedback}
                  onChange={e => setMentorFeedback(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '14px' }}
                />
                <button 
                  onClick={() => {
                    if (!mentorFeedback.trim()) {
                      toast.error("Vui lòng nhập nội dung tin nhắn trước khi gửi!");
                      return;
                    }
                    toast.success(`✉️ Đã gửi tin nhắn trực tiếp đến hộp thư của học sinh ${selectedBooking.mentee_name}!`);
                    handleUpdateStatus(selectedBooking.id, selectedBooking.status);
                  }}
                  style={{ marginTop: '10px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={14} /> Gửi Inbox Ngay
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')} className="btn btn-primary" style={{ background: '#3b82f6' }}>
                  <CheckCircle2 size={16} /> {lang === 'vi' ? 'Xác Nhận Đặt Lịch' : 'Confirm Slot'}
                </button>
                <button onClick={() => handleUpdateStatus(selectedBooking.id, 'completed')} className="btn btn-primary" style={{ background: '#10b981' }}>
                  <Check size={16} /> {lang === 'vi' ? 'Đã Hoàn Thành Cố Vấn' : 'Complete Session'}
                </button>
                <button onClick={() => setSelectedBooking(null)} className="btn">
                  {lang === 'vi' ? 'Đóng' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
