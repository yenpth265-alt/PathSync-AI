export default function ActionExtractor({ handleFileChange, handleUpload, handleReset, status, extractedData }) {
  const getUrgencyColor = (urgency) => {
    if (urgency === 'red') return '#ffebee'
    if (urgency === 'yellow') return '#fff8e1'
    return '#e8f5e9'
  }

  return (
    <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
        <span style={{ fontSize: '24px' }}>🎯</span> Trích xuất Lộ trình (Action Extractor)
      </h2>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
        <input type="file" onChange={handleFileChange} style={{ flex: 1, padding: '10px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#0f172a' }} />
        <button onClick={handleUpload} className="custom-btn" style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>✨ Phân tích AI</button>
        <button onClick={handleReset} className="custom-btn" style={{ padding: '12px 24px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🔄 Reset</button>
      </div>
      
      {status && <p style={{ fontWeight: '600', color: status.includes('✅') ? '#10b981' : '#f59e0b', marginTop: '15px' }}>{status}</p>}

      {extractedData && (
        <div style={{ marginTop: '30px', padding: '25px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Lộ trình: {extractedData.target}</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {extractedData.tasks.map(task => {
              let borderColor = '#10b981'; let bgColor = '#ecfdf5'; let tagText = 'Bình thường';
              if (task.urgency === 'red') { borderColor = '#ef4444'; bgColor = '#fef2f2'; tagText = 'Khẩn cấp'; }
              if (task.urgency === 'yellow') { borderColor = '#f59e0b'; bgColor = '#fffbeb'; tagText = 'Sắp hạn'; }

              return (
                <div key={task.id} className="kanban-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', width: '280px', borderLeftColor: borderColor, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: borderColor, backgroundColor: bgColor, padding: '4px 8px', borderRadius: '4px', marginBottom: '10px', display: 'inline-block' }}>{tagText}</span>
                  <h4 style={{ margin: '10px 0', fontSize: '16px', color: '#0f172a' }}>{task.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>📅 Hạn chót: {task.dueDate}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}