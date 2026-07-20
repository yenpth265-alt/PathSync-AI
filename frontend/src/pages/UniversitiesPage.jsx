import React from 'react';
import { Search, MapPin, ExternalLink, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function UniversitiesPage() {
  const universities = [
    { id: 1, name: 'Massachusetts Institute of Technology', location: 'Cambridge, MA, USA', rank: '#1', match: '95%', color: '#8b0000' },
    { id: 2, name: 'Stanford University', location: 'Stanford, CA, USA', rank: '#2', match: '92%', color: '#8c1515' },
    { id: 3, name: 'Harvard University', location: 'Cambridge, MA, USA', rank: '#3', match: '88%', color: '#a51c30' },
    { id: 4, name: 'University of Oxford', location: 'Oxford, UK', rank: '#4', match: '85%', color: '#002147' },
    { id: 5, name: 'National University of Singapore', location: 'Singapore', rank: '#8', match: '98%', color: '#ef7c00' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Universities</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Discover and shortlist your dream schools.</p>
        </div>
      </header>

      <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input 
          type="text" 
          placeholder="Search by name, location, or major..." 
          style={{ 
            width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', 
            border: '1px solid var(--border-color)', fontSize: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
          }} 
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {universities.map(uni => (
          <motion.div key={uni.id} variants={itemVariants} style={{
            display: 'flex', alignItems: 'center', gap: '20px',
            background: 'white', padding: '20px', borderRadius: '16px',
            border: '1px solid var(--border-color)',
            transition: 'var(--transition-smooth)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '12px',
              backgroundColor: uni.color, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 'bold'
            }}>
              {uni.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>{uni.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {uni.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '600' }}><Star size={14} fill="#f59e0b" /> Global {uni.rank}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--success)', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '8px' }}>
                {uni.match} Match
              </div>
              <button className="btn-icon-small"><ExternalLink size={16} /></button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
