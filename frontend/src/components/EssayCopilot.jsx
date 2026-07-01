export default function EssayCopilot({ essayText, handleEssayTyping, aiFeedbacks, chatEndRef }) {
  return (
    <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
        <span style={{ fontSize: '24px' }}>✍️</span> Trợ lý Viết luận (Real-time Copilot)
      </h2>
      <div style={{ display: 'flex', gap: '30px', height: '450px' }}>
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: '600', color: '#475569', marginBottom: '10px' }}>Nội dung bài luận (Personal Statement)</label>
          <textarea value={essayText} onChange={handleEssayTyping} placeholder="Viết bài luận của bạn tại đây. Khi bạn kết thúc một câu bằng dấu chấm (.), AI sẽ tự động phân tích..." style={{ flex: 1, padding: '20px', fontSize: '16px', lineHeight: '1.6', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', resize: 'none', transition: 'border-color 0.2s', backgroundColor: '#f8fafc', color: '#0f172a' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
        </div>
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: '600', color: '#475569', marginBottom: '10px' }}>Cố vấn Học thuật (Live Feedback)</label>
          <div style={{ flex: 1, padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {aiFeedbacks.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>💡</div>
                <p style={{ margin: 0, fontSize: '15px', color: '#475569' }}>AI đang chờ phân tích câu văn của bạn...</p>
              </div>
            ) : (
              aiFeedbacks.map((fb, idx) => (
                <div key={idx} className="chat-bubble" style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
                  <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '2px 16px 16px 16px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '14.5px', color: '#0f172a', lineHeight: '1.5', flex: 1, border: '1px solid #e2e8f0' }}>{fb}</div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </section>
  )
}