import { useState, useEffect, useRef } from 'react'

function App() {
  // States cho tính năng Upload (Action Extractor)
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [extractedData, setExtractedData] = useState(null)

  // States cho tính năng AI Essay Copilot
  const [essayText, setEssayText] = useState('')
  const [aiFeedbacks, setAiFeedbacks] = useState([])
  const ws = useRef(null)

  // Khởi tạo kết nối WebSocket ngay khi mở web
  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080/api/ws/essay')
    
    ws.current.onopen = () => console.log('✅ Đã kết nối WebSocket!')
    
    ws.current.onmessage = (event) => {
      // Hứng tin nhắn từ Backend và cập nhật UI
      setAiFeedbacks((prev) => [...prev, event.data])
    }

    return () => {
      if (ws.current) ws.current.close()
    }
  }, [])

  // --- CÁC HÀM XỬ LÝ UPLOAD (Giữ nguyên) ---
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
      setStatus('⏳ AI đang bóc tách deadline...')
      const response = await fetch('http://localhost:8080/api/upload', {
        method: 'POST', body: formData,
      })
      const data = await response.json()
      setStatus(`✅ ${data.message}`)
      if (data.project_data) setExtractedData(data.project_data)
    } catch (error) {
      setStatus('❌ Upload thất bại!')
    }
  }

  const handleReset = () => {
    setFile(null)
    setStatus('')
    setExtractedData(null)
    document.querySelector('input[type="file"]').value = ''
  }

  const getUrgencyColor = (urgency) => {
    if (urgency === 'red') return '#ffebee'
    if (urgency === 'yellow') return '#fff8e1'
    return '#e8f5e9'
  }

  // --- HÀM XỬ LÝ VIẾT LUẬN ---
  const handleEssayTyping = (e) => {
    const text = e.target.value
    setEssayText(text)
    
    // Gửi data sang Backend khi người dùng gõ xong một câu (có dấu chấm)
    if (text.endsWith('.') && ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Lấy câu cuối cùng vừa gõ để gửi đi
      const sentences = text.split('.')
      const lastSentence = sentences[sentences.length - 2].trim()
      if (lastSentence) {
        ws.current.send(lastSentence)
      }
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ borderBottom: '2px solid #000', paddingBottom: '10px' }}>
        🚀 PathSync AI - Fullstack Demo
      </h1>
      
      {/* Tính năng 1: Action Extractor */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
        <h3>1. Trích xuất Deadline (Action Extractor)</h3>
        <input type="file" onChange={handleFileChange} />
        <div style={{ marginTop: '15px' }}>
          <button onClick={handleUpload} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Xử lý với AI</button>
          <button onClick={handleReset} style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Làm mới</button>
        </div>
        <p style={{ fontWeight: 'bold', marginTop: '15px' }}>{status}</p>
        
        {extractedData && (
          <div style={{ border: '2px dashed #4caf50', padding: '20px', borderRadius: '8px', marginTop: '15px' }}>
            <h2>🎯 {extractedData.target}</h2>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {extractedData.tasks.map(task => (
                <div key={task.id} style={{ backgroundColor: getUrgencyColor(task.urgency), padding: '15px', borderRadius: '6px', width: '200px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{task.title}</h4>
                  <p style={{ margin: '0', fontSize: '14px' }}>⏳ Hạn chót: <strong>{task.dueDate}</strong></p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tính năng 2: AI Essay Copilot */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h3>2. Trợ lý Viết luận (AI Essay Copilot - WebSocket)</h3>
        <div style={{ display: 'flex', gap: '20px', height: '300px' }}>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>Bài luận của bạn:</label>
            <textarea 
              value={essayText}
              onChange={handleEssayTyping}
              placeholder="Thử gõ một câu tiếng Anh và kết thúc bằng dấu chấm (.). Ví dụ: I want to study in Australia."
              style={{ flex: 1, padding: '15px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', resize: 'none' }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>Phân tích Real-time từ AI:</label>
            <div style={{ flex: 1, padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '8px', overflowY: 'auto', border: '1px solid #cce4f7' }}>
              {aiFeedbacks.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>AI đang chờ bạn gõ xong câu...</p>
              ) : (
                aiFeedbacks.map((fb, idx) => (
                  <div key={idx} style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '4px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    🤖 {fb}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

export default App