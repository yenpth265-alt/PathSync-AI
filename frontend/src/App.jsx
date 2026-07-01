import { useState, useEffect, useRef } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [extractedData, setExtractedData] = useState(null)
  const [essayText, setEssayText] = useState('')
  const [aiFeedbacks, setAiFeedbacks] = useState([])
  const ws = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080/api/ws/essay')
    ws.current.onopen = () => console.log('✅ Đã kết nối WebSocket!')
    ws.current.onmessage = (event) => {
      setAiFeedbacks((prev) => [...prev, event.data])
    }
    return () => {
      if (ws.current) ws.current.close()
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiFeedbacks])

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setExtractedData(null)
    setStatus('')
  }

  const handleUpload = async () => {
    if (!file) return alert("Vui lòng chọn file!")
    const formData = new FormData()
    formData.append("document", file)

    try {
      setStatus('⏳ Hệ thống AI đang quét tài liệu...')
      const response = await fetch('http://localhost:8080/api/upload', {
        method: 'POST', body: formData,
      })
      const data = await response.json()
      setStatus(`✅ ${data.message}`)
      if (data.project_data) setExtractedData(data.project_data)
    } catch (error) {
      setStatus('❌ Upload thất bại. Kiểm tra kết nối server!')
    }
  }

  const handleReset = () => {
    setFile(null)
    setStatus('')
    setExtractedData(null)
    document.querySelector('input[type="file"]').value = ''
  }

  const handleEssayTyping = (e) => {
    const text = e.target.value
    setEssayText(text)
    
    if (text.endsWith('.') && ws.current && ws.current.readyState === WebSocket.OPEN) {
      const sentences = text.split('.')
      const lastSentence = sentences[sentences.length - 2].trim()
      if (lastSentence) {
        ws.current.send(lastSentence)
      }
    }
  }

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#0f172a' }}>
      <style>
        {`
          .custom-btn { transition: all 0.2s ease; font-weight: 600; }
          .custom-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
          .kanban-card { transition: all 0.3s ease; border-left: 5px solid transparent; }
          .kanban-card:hover { transform: translateY(-5px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
          .chat-bubble { animation: slideIn 0.3s ease-out forwards; }
          @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          input::file-selector-button { font-weight: 600; color: #0f172a; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
          input::file-selector-button:hover { background-color: #e2e8f0; }
        `}
      </style>

      <header style={{ backgroundColor: '#ffffff', padding: '15px 40px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #007bff, #00d2ff)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>P</div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', background: 'linear-gradient(135deg, #007bff, #0056b3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PathSync AI</h1>
        </div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '20px' }}>
          🟢 System Status: Trực tuyến
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
            <span style={{ fontSize: '24px' }}>🎯</span> Trích xuất Lộ trình (Action Extractor)
          </h2>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <input type="file" onChange={handleFileChange} style={{ flex: 1, padding: '10px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#0f172a' }} />
            <button onClick={handleUpload} className="custom-btn" style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              ✨ Phân tích AI
            </button>
            <button onClick={handleReset} className="custom-btn" style={{ padding: '12px 24px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              🔄 Reset
            </button>
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
                      <span style={{ fontSize: '12px', fontWeight: '700', color: borderColor, backgroundColor: bgColor, padding: '4px 8px', borderRadius: '4px', marginBottom: '10px', display: 'inline-block' }}>
                        {tagText}
                      </span>
                      <h4 style={{ margin: '10px 0', fontSize: '16px', color: '#0f172a' }}>{task.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                        📅 Hạn chót: {task.dueDate}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
            <span style={{ fontSize: '24px' }}>✍️</span> Trợ lý Viết luận (Real-time Copilot)
          </h2>
          
          <div style={{ display: 'flex', gap: '30px', height: '450px' }}>
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontWeight: '600', color: '#475569', marginBottom: '10px' }}>Nội dung bài luận (Personal Statement)</label>
              <textarea 
                value={essayText}
                onChange={handleEssayTyping}
                placeholder="Viết bài luận của bạn tại đây. Khi bạn kết thúc một câu bằng dấu chấm (.), AI sẽ tự động phân tích..."
                style={{ flex: 1, padding: '20px', fontSize: '16px', lineHeight: '1.6', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', resize: 'none', transition: 'border-color 0.2s', backgroundColor: '#f8fafc', color: '#0f172a' }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
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
                      <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '2px 16px 16px 16px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '14.5px', color: '#0f172a', lineHeight: '1.5', flex: 1, border: '1px solid #e2e8f0' }}>
                        {fb}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

export default App