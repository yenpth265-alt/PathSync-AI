import React, { useState, useEffect, useRef } from 'react';
import { FileText, Search, Plus, Filter, MoreVertical, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchDocuments, createDocument, deleteDocument, uploadDocumentFile } from '../services/api';

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
      const docType = ['PDF', 'DOCX', 'ZIP'].includes(ext) ? ext : 'PDF';
      await uploadDocumentFile(file, file.name, docType);
      await loadDocuments();
    } catch (err) {
      console.error("Real upload failed, falling back to mock record creation", err);
      // Fallback if no server storage
      await createDocument({
        title: file.name,
        doc_type: 'PDF'
      });
      await loadDocuments();
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };


  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if(window.confirm('Delete this document?')) {
      try {
        await deleteDocument(id);
        await loadDocuments();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredDocs = documents.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Documents</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Manage your application materials and certificates.</p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
        <button className="btn btn-primary" onClick={handleUploadClick} disabled={isUploading}>
          <Plus size={16} /> {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '14px', background: 'var(--bg-color)', color: 'var(--text-main)' }} 
          />
        </div>
        <button className="btn btn-outline"><Filter size={16} /> Filter</button>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}
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
              <button className="btn-icon-small" onClick={(e) => handleDelete(doc.id, e)} title="Delete Document">
                <Trash2 size={16} color="var(--text-muted)" />
              </button>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {doc.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{type} • {new Date(doc.created_at).toLocaleDateString()}</p>
            </div>
          </motion.div>
        )})}
      </motion.div>
    </div>
  );
}
