import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Star, Award, DollarSign, BookOpen, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

export default function UniversitiesPage() {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const scholarships = [
    { 
      id: 1, 
      uniName: 'Massachusetts Institute of Technology', 
      location: 'Cambridge, MA, USA', 
      title: 'MIT Excellence Scholarship',
      funding: 'Full Ride',
      deadline: 'Dec 15, 2026',
      match: '95%', 
      color: '#8b0000',
      type: 'Scholarship'
    },
    { 
      id: 2, 
      uniName: 'Stanford University', 
      location: 'Stanford, CA, USA', 
      title: 'Knight-Hennessy Scholars',
      funding: 'Full Tuition + Stipend',
      deadline: 'Oct 12, 2026',
      match: '92%', 
      color: '#8c1515',
      type: 'Scholarship'
    },
    { 
      id: 3, 
      uniName: 'Harvard University', 
      location: 'Cambridge, MA, USA', 
      title: 'Harvard College Financial Aid',
      funding: '100% Need-Based',
      deadline: 'Jan 1, 2027',
      match: '88%', 
      color: '#a51c30',
      type: 'Financial Aid'
    },
    { 
      id: 4, 
      uniName: 'University of Oxford', 
      location: 'Oxford, UK', 
      title: 'Clarendon Fund Scholarships',
      funding: 'Full Tuition',
      deadline: 'Jan 20, 2027',
      match: '85%', 
      color: '#002147',
      type: 'Scholarship'
    },
    { 
      id: 5, 
      uniName: 'National University of Singapore', 
      location: 'Singapore', 
      title: 'ASEAN Undergraduate Scholarship',
      funding: 'Tuition + Allowance',
      deadline: 'Feb 28, 2027',
      match: '98%', 
      color: '#ef7c00',
      type: 'Scholarship'
    },
  ];

  const filteredData = scholarships.filter(item => {
    const matchesSearch = item.uniName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || item.type === filter || (filter === 'USA' && item.location.includes('USA'));
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(100,108,255,0.1) 0%, rgba(236,72,153,0.1) 100%)',
        borderRadius: '24px',
        padding: '48px 40px',
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(100,108,255,0.2)', color: '#8890ff', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
            <Award size={14} /> AI-Powered Matching
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1px', marginBottom: '12px', lineHeight: '1.2' }}>
            Discover Your Perfect <span style={{ background: 'linear-gradient(to right, #646cff, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Scholarship</span>
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '32px' }}>
            We aggregate top scholarships directly from university portals and match them with your profile to maximize your chances.
          </p>
          
          <div style={{ position: 'relative', width: '100%', display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search universities, programs, or countries..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', padding: '16px 20px 16px 52px', borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px',
                  background: 'rgba(13,17,23,0.7)', color: 'var(--text-main)',
                  backdropFilter: 'blur(10px)', outline: 'none', transition: 'all 0.2s'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div style={{ position: 'absolute', right: '-10%', top: '-20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', right: '10%', bottom: '-30%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(100,108,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', marginRight: '8px' }}>
          <Filter size={16} /> Filters:
        </div>
        {['All', 'Scholarship', 'Financial Aid', 'USA'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '500',
              background: filter === f ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Results List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <AnimatePresence>
          {filteredData.map(item => (
            <motion.div key={item.id} variants={itemVariants} initial="hidden" animate="show" exit="exit" layout
              style={{
                display: 'flex', alignItems: 'center', gap: '24px',
                background: 'rgba(22,27,43,0.6)', padding: '24px', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                cursor: 'pointer', position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.transform = 'translateY(-4px)'; 
                e.currentTarget.style.borderColor = 'rgba(100,108,255,0.4)'; 
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)'; 
                e.currentTarget.style.background = 'rgba(22,27,43,0.9)';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.transform = 'none'; 
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; 
                e.currentTarget.style.boxShadow = 'none'; 
                e.currentTarget.style.background = 'rgba(22,27,43,0.6)';
              }}
            >
              {/* Highlight Bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: item.color }}></div>

              <div style={{
                width: '72px', height: '72px', borderRadius: '16px',
                backgroundColor: item.color, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 'bold', flexShrink: 0,
                boxShadow: `0 8px 16px ${item.color}40`
              }}>
                {item.uniName.charAt(0)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{item.uniName}</h2>
                  <span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-muted)' }}>{item.type}</span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '500', color: '#8890ff', marginBottom: '12px' }}>{item.title}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {item.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} /> {item.funding}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={14} /> Deadline: {item.deadline}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                  background: 'rgba(16,185,129,0.1)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' 
                }}>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Match Score</span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{item.match}</span>
                </div>
                <button style={{ 
                  background: 'transparent', border: 'none', color: '#8890ff', 
                  fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' 
                }}>
                  Apply Now <ExternalLink size={14} />
                </button>
              </div>
            </motion.div>
          ))}
          
          {filteredData.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '16px' }}>
                <Search size={32} opacity={0.5} />
              </div>
              <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '8px' }}>No scholarships found</h3>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
