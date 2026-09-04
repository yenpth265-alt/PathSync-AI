import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, DollarSign, CheckCircle2, XCircle, 
  MessageSquare, Sparkles, Award, Settings, FileText, Check, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getBookings, updateBookingStatus, updateMentorProfile, getMentors, aiEssayReview } from '../services/api';
import { useAuth } from '../context/useAuth';

const AVAILABLE_SLOTS = ['T2 19:00', 'T3 14:00', 'T4 20:00', 'T6 18:30', 'T7 15:00', 'CN 10:00'];

export default function MentorDashboardPage({ lang = 'vi' }) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'ai-pro' | 'availability'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [mentorFeedback, setMentorFeedback] = useState('');
  const [hourlyRate, setHourlyRate] = useState(120000);
  const [bio, setBio] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);

  // AI Mentor Pro — the panel used to be a static hardcoded critique with a
  // button that only fired a canned success toast, with no student, essay,
  // or real AI call involved at all.
  const [essayBookingId, setEssayBookingId] = useState('');
  const [essayReview, setEssayReview] = useState(null);
  const [essayLoading, setEssayLoading] = useState(false);

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

  // The rate/bio/slots fields used to always start from hardcoded
  // placeholders (120000, a canned bio, no slots) because nothing ever
  // fetched the mentor's actually-saved profile — every visit showed fake
  // defaults, and saving without changing them silently overwrote whatever
  // was really saved with those placeholders.
  const loadOwnMentorProfile = async () => {
    if (!profile?.id) return;
    try {
      const mentors = await getMentors();
      const mine = mentors.find(m => m.user_id === profile.id);
      if (mine) {
        setHourlyRate(mine.hourly_rate || 120000);
        setBio(mine.bio || '');
        try {
          const slots = JSON.parse(mine.calendar_slots || '[]');
          setSelectedSlots(Array.isArray(slots) ? slots : []);
        } catch {
          setSelectedSlots([]);
        }
      }
    } catch (e) {
      console.error('Failed to load mentor profile', e);
    }
  };

  useEffect(() => {
    fetchMentorBookings();
    loadOwnMentorProfile();
  }, [profile?.id]);

  const toggleSlot = (slot) => {
    setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
  };

  const bookingsWithEssay = bookings.filter(b => b.essay_draft);

  const handleRunEssayReview = async () => {
    const booking = bookingsWithEssay.find(b => b.id === essayBookingId);
    if (!booking) {
      toast.error(lang === 'vi' ? 'Chọn một học sinh có bài luận nháp trước.' : 'Select a student with an essay draft first.');
      return;
    }
    setEssayLoading(true);
    setEssayReview(null);
    try {
      const res = await aiEssayReview(booking.essay_draft, '');
      setEssayReview(res);
    } catch (e) {
      toast.error(e.message || (lang === 'vi' ? 'Lỗi khi chấm bài' : 'Failed to review essay'));
    } finally {
      setEssayLoading(false);
    }
  };

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
      await updateMentorProfile({ hourly_rate: Number(hourlyRate), bio, calendar_slots: JSON.stringify(selectedSlots) });
      toast.success(lang === 'vi' ? 'Đã cập nhật lịch rảnh, mức phí & mô tả!' : 'Updated availability, rate & bio!');
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
            <Calendar size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)' }}>{confirmedBookings.length} người</div>
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
            padding: '12px 16px', fontWeight: '600', borderBottom: activeTab === 'bookings' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'bookings' ? 'var(--primary)' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' 
          }}
        >
          {lang === 'vi' ? 'Danh Sách Học Sinh & Đặt Lịch' : 'Student Requests'} ({bookings.length})
        </button>
        <button 
          onClick={() => setActiveTab('ai-pro')}
          style={{ 
            padding: '12px 16px', fontWeight: '600', borderBottom: activeTab === 'ai-pro' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'ai-pro' ? 'var(--primary)' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Sparkles size={16} color="var(--primary)" /> {lang === 'vi' ? 'AI Mentor Pro (Chấm Luận Siêu Tốc)' : 'AI Mentor Pro Assistant'}
        </button>
        <button 
          onClick={() => setActiveTab('availability')}
          style={{ 
            padding: '12px 16px', fontWeight: '600', borderBottom: activeTab === 'availability' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'availability' ? 'var(--primary)' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' 
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
                    background: b.status === 'confirmed' ? 'var(--sidebar-active-bg)' : b.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: b.status === 'confirmed' ? 'var(--primary)' : b.status === 'completed' ? '#10b981' : '#f59e0b'
                  }}>
                    {b.status === 'confirmed' ? 'ĐANG CỐ VẤN' : b.status === 'completed' ? 'ĐÃ HOÀN THÀNH' : 'CHỜ DUYỆT'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  🕒 Khung giờ hẹn: <strong>{b.slot_time}</strong> • 🎯 Nguyện vọng: <strong>{b.target_university || (lang === 'vi' ? 'Chưa cung cấp' : 'Not provided')}{b.target_major ? ` - ${b.target_major}` : ''}</strong>
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
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{lang === 'vi' ? 'AI Mentor Pro - Trợ Lý Chấm Bài Nháp Thần Tốc' : 'AI Mentor Pro Pre-Review Assistant'}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Tiết kiệm 50% thời gian đọc nháp. AI rà soát lỗi cấu trúc & tạo khung gợi ý sẵn cho Mentor.' : 'Saves 50% reading time. AI scans for structural weaknesses and prepares feedback framework.'}</p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              {lang === 'vi' ? 'Chọn học sinh có bài luận nháp gửi kèm:' : 'Select a student with an attached essay draft:'}
            </label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <select
                value={essayBookingId}
                onChange={e => { setEssayBookingId(e.target.value); setEssayReview(null); }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
              >
                <option value="">{lang === 'vi' ? '-- Chọn học sinh --' : '-- Select student --'}</option>
                {bookingsWithEssay.map(b => (
                  <option key={b.id} value={b.id}>{b.mentee_name}</option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={handleRunEssayReview}
                disabled={!essayBookingId || essayLoading}
              >
                {essayLoading ? (lang === 'vi' ? 'Đang chấm...' : 'Reviewing...') : (lang === 'vi' ? '⚡ Rà Soát Bài Luận' : '⚡ Review Essay')}
              </button>
            </div>

            {bookingsWithEssay.length === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {lang === 'vi' ? 'Chưa có học sinh nào gửi kèm bài luận nháp.' : 'No student has attached an essay draft yet.'}
              </p>
            )}

            {essayReview && (
              <div style={{ marginTop: '4px' }}>
                {typeof essayReview.score === 'number' && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {lang === 'vi' ? 'Điểm số' : 'Score'}: <strong style={{ color: 'var(--primary)', fontSize: '16px' }}>{essayReview.score}/100</strong>
                  </div>
                )}
                <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{essayReview.feedback}</p>
              </div>
            )}
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
              {AVAILABLE_SLOTS.map((slot) => (
                <label key={slot} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedSlots.includes(slot)} onChange={() => toggleSlot(slot)} /> {slot}
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
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px' }}>👤 {selectedBooking.mentee_name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                  <div>🏛️ Trường mục tiêu: <strong>{selectedBooking.target_university || (lang === 'vi' ? 'Chưa cung cấp' : 'Not provided')}</strong></div>
                  <div>💻 Ngành dự định: <strong>{selectedBooking.target_major || (lang === 'vi' ? 'Chưa cung cấp' : 'Not provided')}</strong></div>
                  <div>🎓 Năng lực học thuật: <strong style={{ color: 'var(--success)' }}>{selectedBooking.student_gpa ? `GPA ${selectedBooking.student_gpa}/4.0` : (lang === 'vi' ? 'Chưa có GPA' : 'No GPA')}{selectedBooking.student_ielts ? ` | ${selectedBooking.student_ielts}` : ''}</strong></div>
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
              <div style={{ background: 'var(--secondary)', padding: '16px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  style={{ marginTop: '10px', padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={14} /> Gửi Inbox Ngay
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')} className="btn btn-primary" style={{ background: 'var(--primary)' }}>
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
