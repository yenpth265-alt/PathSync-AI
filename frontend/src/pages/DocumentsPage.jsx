import React from 'react';
import { FileText, Search, Plus, Filter, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const documents = [
    { id: 1, name: 'High School Transcript.pdf', type: 'PDF', size: '2.4 MB', date: 'Jul 15, 2026' },
    { id: 2, name: 'IELTS_Certificate_8.0.pdf', type: 'PDF', size: '1.1 MB', date: 'Jul 10, 2026' },
    { id: 3, name: 'Personal_Statement_Draft3.docx', type: 'DOCX', size: '45 KB', date: 'Jul 18, 2026' },
    { id: 4, name: 'Recommendation_Letter_MrSmith.pdf', type: 'PDF', size: '800 KB', date: 'Jun 28, 2026' },
    { id: 5, name: 'Extracurricular_Certificates.zip', type: 'ZIP', size: '15.6 MB', date: 'Jul 05, 2026' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Documents</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Manage your application materials and certificates.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Upload File
        </button>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search documents..." 
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
        {documents.map(doc => (
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
                background: doc.type === 'PDF' ? '#fee2e2' : doc.type === 'DOCX' ? '#e0f2fe' : '#fef9c3',
                color: doc.type === 'PDF' ? '#ef4444' : doc.type === 'DOCX' ? '#0ea5e9' : '#eab308',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FileText size={20} />
              </div>
              <button className="btn-icon-small"><MoreVertical size={16} /></button>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {doc.name}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{doc.size} • {doc.date}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
