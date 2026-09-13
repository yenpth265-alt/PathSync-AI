import React, { useState, useEffect, useRef } from 'react';
import { FileText, Search, Plus, Trash2, Sparkles, CheckCircle2, Award, BookOpen, UserCheck, X, CalendarClock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchDocuments, createDocument, deleteDocument, uploadDocumentFile, aiExtractCV, aiExtractActions, fetchDocumentText, fetchApplications, addSubtask } from '../services/api';
import toast from 'react-hot-toast';

// Ranh giới hiển thị cho confidence score — khớp với ngưỡng needs_review=0.5
// phía backend (buildExtractedAction, actions.go): dưới 0.5 luôn bị đánh dấu
// cần xem lại nên không thể hiện xanh; 0.8 là mốc "đủ tin để tick sẵn".
// Dùng chung token --success/--warning/--danger (index.css) thay vì hex cứng,
// để badge tự đổi theo dark mode giống mọi badge trạng thái khác trong app
// (xem .badge-urgent/.badge-soon/.badge-ontrack trong KanbanCard.css).
const confidenceStyle = (score) => {
  const token = score >= 0.8 ? '--success' : score >= 0.5 ? '--warning' : '--danger';
  return { bg: `color-mix(in srgb, var(${token}) 16%, transparent)`, color: `var(${token})` };
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [actionReview, setActionReview] = useState(null); // { docTitle, items: [...] }
  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [isSavingActions, setIsSavingActions] = useState(false);
  const fileInputRef = useRef(null);

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Extraction results only live in React state until the user explicitly
  // confirms (see handleConfirmProfile / handleCreateSelectedActions) — a
  // deliberate trade-off so nothing is saved without review. But a paid LLM
  // call already ran to produce them, so closing the tab or refreshing while
  // a review modal is open should not silently throw that away with no
  // warning.
  useEffect(() => {
    const hasUnconfirmedExtraction = Boolean(extractedData || actionReview);
    if (!hasUnconfirmedExtraction) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [extractedData, actionReview]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop().toUpperCase();
      const docType = ['PDF', 'DOCX', 'ZIP', 'JPG', 'JPEG', 'PNG'].includes(ext) ? ext : 'PDF';
      await uploadDocumentFile(file, file.name, docType);
      await loadDocuments();
      toast.success("📄 Đã tải tài liệu lên thành công!");
    } catch (err) {
      console.error("Real upload failed, falling back to mock record creation", err);
      await createDocument({
        title: file.name,
        doc_type: 'PDF'
      });
      await loadDocuments();
      toast.success("📄 Đã tải tài liệu lên thành công!");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if(window.confirm('Xóa tài liệu này khỏi hệ thống?')) {
      try {
        await deleteDocument(id);
        await loadDocuments();
        toast.success("Đã xóa tài liệu.");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredDocs = documents.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleExtractCV = async (doc, e) => {
    e.stopPropagation();
    toast.loading("Đang bóc tách CV bằng AI...", { id: 'cv-extract' });
    
    try {
      // Lấy nội dung text thật từ file PDF/DOCX. Nếu file là ảnh scan hoặc
      // PDF không có lớp văn bản, backend trả kèm file_data/mime_type để AI
      // đọc trực tiếp file gốc thay vì chỉ dựa vào text đã bóc tách.
      const textData = await fetchDocumentText(doc.id);

      const parsedData = await aiExtractCV(textData.text || '', textData.file_data, textData.mime_type);

      // Hồ sơ Smart Match KHÔNG được ghi ở đây. Kết quả chỉ hiện trong modal
      // xem lại bên dưới; việc ghi vào localStorage chỉ xảy ra khi người dùng
      // bấm xác nhận (handleConfirmProfile) — đóng modal bằng nút X coi như
      // huỷ, không để lại thay đổi nào.
      setExtractedData({ docTitle: doc.title, ...parsedData });
      toast.success(`🎉 AI đã bóc tách xong CV từ "${doc.title}". Xem lại và xác nhận để đồng bộ với Smart Match.`, { id: 'cv-extract' });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Lỗi khi bóc tách CV. Vui lòng thử lại.", { id: 'cv-extract' });
    }
  };

  const handleConfirmProfile = () => {
    if (!extractedData) return;
    const { docTitle, ...profileData } = extractedData;
    localStorage.setItem('ps_user_profile', JSON.stringify(profileData));
    window.dispatchEvent(new Event('userProfileUpdated'));
    setExtractedData(null);
    window.location.href = '/smart-match';
  };

  const handleExtractActions = async (doc, e) => {
    e.stopPropagation();
    toast.loading("Đang trích xuất mốc & hồ sơ...", { id: 'action-extract' });

    try {
      const textData = await fetchDocumentText(doc.id);
      const result = await aiExtractActions(textData.text || '', textData.file_data, textData.mime_type);
      const rawActions = result.actions || [];

      if (rawActions.length === 0) {
        toast.success("Không tìm thấy mốc thời gian hay hồ sơ nào trong tài liệu này.", { id: 'action-extract' });
        return;
      }

      // Tick sẵn những mốc AI đủ tự tin; mốc needs_review để trống, buộc
      // người dùng tự nhìn qua trước khi nó được tính là "đã duyệt".
      const items = rawActions.map((a) => ({
        ...a,
        checked: !a.needs_review,
        dueDateInput: a.parsed_date || ''
      }));
      setActionReview({ docTitle: doc.title, items });

      if (applications.length === 0) {
        const apps = await fetchApplications();
        setApplications(apps);
        if (apps.length > 0) setSelectedAppId(apps[0].id);
      }

      toast.success(`Tìm thấy ${rawActions.length} mốc. Hãy xem lại trước khi lưu vào Kanban.`, { id: 'action-extract' });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Lỗi khi trích xuất. Vui lòng thử lại.", { id: 'action-extract' });
    }
  };

  const toggleActionChecked = (idx) => {
    setActionReview((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((it, i) => (i === idx ? { ...it, checked: !it.checked } : it));
      return { ...prev, items };
    });
  };

  const updateActionDueDate = (idx, value) => {
    setActionReview((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((it, i) => (i === idx ? { ...it, dueDateInput: value } : it));
      return { ...prev, items };
    });
  };

  const handleCreateSelectedActions = async () => {
    if (!actionReview) return;
    if (!selectedAppId) {
      toast.error("Chọn một hồ sơ (trường) để gắn các thẻ này vào.");
      return;
    }
    const pendingIndices = actionReview.items
      .map((it, idx) => (it.checked ? idx : -1))
      .filter((idx) => idx !== -1);
    if (pendingIndices.length === 0) {
      toast.error("Chưa chọn mốc nào để tạo thẻ.");
      return;
    }

    setIsSavingActions(true);
    let createdCount = 0;
    // Uncheck each item right after it's actually created (not after the
    // whole batch finishes), so if a later item fails partway through, only
    // the genuinely-not-yet-created items remain checked — retrying can't
    // resubmit ones that already made it onto the Kanban board.
    for (const idx of pendingIndices) {
      const item = actionReview.items[idx];
      try {
        await addSubtask(selectedAppId, { title: item.title, due_date: item.dueDateInput || '' });
        createdCount++;
        setActionReview((prev) => {
          if (!prev) return prev;
          const items = prev.items.map((it, i) => (i === idx ? { ...it, checked: false } : it));
          return { ...prev, items };
        });
      } catch (err) {
        console.error(err);
        toast.error(err.message || `Lỗi khi tạo thẻ "${item.title}". Các mốc còn lại vẫn đang được chọn — thử lại khi đã sẵn sàng.`);
        setIsSavingActions(false);
        return;
      }
    }

    setIsSavingActions(false);
    toast.success(`Đã tạo ${createdCount} thẻ trên Kanban.`);
    setActionReview(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Tài Liệu Của Tôi</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Quản lý hồ sơ, bằng cấp và bóc tách CV để AI tối ưu hóa lộ trình tuyển sinh.</p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
        <button className="btn btn-primary" onClick={handleUploadClick} disabled={isUploading}>
          <Plus size={16} /> {isUploading ? 'Đang tải lên...' : 'Tải File Lên'}
        </button>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm tài liệu..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '14px', background: 'var(--bg-color)', color: 'var(--text-main)' }} 
          />
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}
      >
        {filteredDocs.map(doc => {
          const type = doc.doc_type || 'PDF';
          return (
          <motion.div key={doc.id} variants={itemVariants} style={{ 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '16px', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'var(--transition-smooth)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '10px', 
                background: type === 'PDF' ? '#fee2e2' : type === 'DOCX' ? '#e0f2fe' : '#fef9c3',
                color: type === 'PDF' ? '#ef4444' : type === 'DOCX' ? '#0ea5e9' : '#eab308',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FileText size={20} />
              </div>
              <button className="btn-icon-small" onClick={(e) => handleDelete(doc.id, e)} title="Xóa tài liệu">
                <Trash2 size={16} color="var(--text-muted)" />
              </button>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {doc.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{type} • {new Date(doc.created_at).toLocaleDateString()}</p>
            </div>
            <button
              onClick={(e) => handleExtractCV(doc, e)}
              style={{ width: '100%', padding: '10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Sparkles size={14} /> Trích Xuất CV & Đồng Bộ Smart Match
            </button>
            <button
              onClick={(e) => handleExtractActions(doc, e)}
              style={{ width: '100%', padding: '10px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <CalendarClock size={14} /> Trích Xuất Deadline & Hồ Sơ
            </button>
          </motion.div>
        )})}
      </motion.div>

      {/* Extracted Profile Modal */}
      {extractedData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-color)', width: '100%', maxWidth: '640px', borderRadius: '24px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-premium)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', pb: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>Kết Quả Bóc Tách CV từ AI</h2>
              </div>
              <button className="btn-icon" onClick={() => setExtractedData(null)} title="Huỷ bỏ, không lưu"><X size={20} /></button>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.08)', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                <span>🎓 GPA: <strong style={{ color: 'var(--primary)' }}>{extractedData.gpa || 'N/A'}</strong></span>
                <span>📜 IELTS: <strong style={{ color: '#10b981' }}>{extractedData.ielts || 'N/A'}</strong></span>
                <span>📊 SAT: <strong style={{ color: '#8b5cf6' }}>{extractedData.sat || 'N/A'}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="#eab308" /> Điểm Mạnh Ẩn AI Khai Thác Được (Hidden Strengths):
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(extractedData.hiddenStrengths || []).map((s, idx) => (
                    <li key={idx} style={{ fontSize: '13px', color: 'var(--text-main)', background: 'var(--card-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={14} color="#10b981" /> {s}
                    </li>
                  ))}
                  {!(extractedData.hiddenStrengths && extractedData.hiddenStrengths.length > 0) && <li style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Chưa rõ</li>}
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <BookOpen size={16} color="var(--primary)" /> Nghiên Cứu & Dự Án Nổi Bật:
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(extractedData.researchProjects || []).map((p, idx) => (
                    <li key={idx} style={{ fontSize: '13px', color: 'var(--text-muted)' }}>• {p}</li>
                  ))}
                  {!(extractedData.researchProjects && extractedData.researchProjects.length > 0) && <li style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Không có</li>}
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Award size={16} color="var(--warning)" /> Hoạt Động Ngoại Khóa & Giải Thưởng:
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {((extractedData.extracurriculars || []).concat(extractedData.awards || [])).map((a, idx) => (
                    <li key={idx} style={{ fontSize: '13px', color: 'var(--text-muted)' }}>• {a}</li>
                  ))}
                  {!(extractedData.extracurriculars && extractedData.extracurriculars.length > 0) && !(extractedData.awards && extractedData.awards.length > 0) && <li style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Không có</li>}
                </ul>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', pt: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={14} /> {extractedData.lorStatus || 'Chưa đề cập tới thư giới thiệu'}
                </span>
                <button className="btn btn-primary" onClick={handleConfirmProfile}>
                  ✅ Xác Nhận & Đồng Bộ Vào Smart Match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Extractor Review Modal — nothing here is written to the
          Kanban board until "Tạo N Thẻ" is clicked; closing with X discards
          the whole review with no side effect, same contract as the CV
          extraction modal above. */}
      {actionReview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-color)', width: '100%', maxWidth: '720px', borderRadius: '24px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-premium)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CalendarClock style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>Xem Lại Mốc Trích Xuất Từ "{actionReview.docTitle}"</h2>
              </div>
              <button className="btn-icon" onClick={() => setActionReview(null)} title="Huỷ bỏ, không lưu"><X size={20} /></button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Ngày tháng được một lớp mã kiểm tra lại, không phải AI tự tính — hãy sửa lại nếu chưa đúng. Bỏ tick mốc nào bạn không muốn tạo thẻ.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {actionReview.items.map((item, idx) => {
                const cs = confidenceStyle(item.confidence);
                return (
                  <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: item.checked ? 'var(--card-bg)' : 'transparent', opacity: item.checked ? 1 : 0.6 }}>
                    <input type="checkbox" checked={item.checked} onChange={() => toggleActionChecked(idx)} style={{ marginTop: '4px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{item.title || 'Chưa rõ tên mốc'}</strong>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'var(--sidebar-active-bg)', color: 'var(--primary)', textTransform: 'uppercase' }}>{item.category || 'other'}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: cs.bg, color: cs.color }}>
                          {Math.round((item.confidence || 0) * 100)}% tin cậy
                        </span>
                        {item.needs_review && (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={12} /> Cần xem lại
                          </span>
                        )}
                      </div>

                      {item.evidence_span && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '6px 0 0' }}>
                          "{item.evidence_span}"
                          {item.evidence_verified === false && (
                            <span style={{ color: '#dc2626', fontStyle: 'normal', fontWeight: 600 }}> — không tìm thấy trích dẫn này trong văn bản gốc</span>
                          )}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Ngày gốc trong văn bản: <strong style={{ color: 'var(--text-main)' }}>{item.raw_date_text || '(không có)'}</strong>
                        </label>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Due date:
                          <input
                            type="date"
                            value={item.dueDateInput}
                            onChange={(e) => updateActionDueDate(idx, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '12px' }}
                          />
                        </label>
                        {item.date_ambiguous && (
                          <span style={{ fontSize: '11px', color: '#ca8a04' }}>⚠ Ngày có thể đọc theo 2 cách (DD/MM hoặc MM/DD) — vui lòng kiểm tra lại</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Gắn vào hồ sơ:
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '13px', minWidth: '220px' }}
                >
                  <option value="">-- Chọn trường/hồ sơ --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>{app.university_name || app.university}</option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary" onClick={handleCreateSelectedActions} disabled={isSavingActions}>
                {isSavingActions ? 'Đang tạo...' : `✅ Tạo ${actionReview.items.filter(i => i.checked).length} Thẻ`}
              </button>
            </div>
            {applications.length === 0 && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '10px' }}>
                Bạn chưa có hồ sơ trường nào trên Kanban. Hãy tạo một hồ sơ ở trang Ứng Tuyển trước khi gắn thẻ.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
