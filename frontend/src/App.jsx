import { useState } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [extractedData, setExtractedData] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    // Reset data khi chọn file mới
    setExtractedData(null) 
    setStatus('')
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Vui lòng chọn file brochure PDF/Ảnh!")
      return
    }

    const formData = new FormData()
    formData.append("document", file)

    try {
      setStatus('⏳ Hệ thống AI đang bóc tách deadline...')
      const response = await fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      setStatus(`✅ ${data.message}`)
      if (data.project_data) {
        setExtractedData(data.project_data)
      }
    } catch (error) {
      console.error("Lỗi:", error)
      setStatus('❌ Upload thất bại! Kiểm tra lại server Golang.')
    }
  }

  // Hàm helper để đổi màu thẻ theo độ khẩn cấp
  const getUrgencyColor = (urgency) => {
    if (urgency === 'red') return '#ffebee'
    if (urgency === 'yellow') return '#fff8e1'
    return '#e8f5e9'
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px', fontFamily: 'system-ui' }}>
      <h1 style={{ borderBottom: '2px solid #000', paddingBottom: '10px' }}>
        🚀 PathSync AI - Action Extractor
      </h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>1. Upload Tài Liệu Tuyển Sinh</h3>
        <input type="file" onChange={handleFileChange} />
        <button 
          onClick={handleUpload} 
          style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Xử lý với AI
        </button>
        <p style={{ fontWeight: 'bold', marginTop: '15px' }}>{status}</p>
      </div>

      {extractedData && (
        <div style={{ border: '2px dashed #4caf50', padding: '20px', borderRadius: '8px' }}>
          <h2>🎯 Mục tiêu: {extractedData.target}</h2>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {extractedData.tasks.map(task => (
              <div 
                key={task.id} 
                style={{ 
                  backgroundColor: getUrgencyColor(task.urgency), 
                  padding: '15px', 
                  borderRadius: '6px', 
                  width: '200px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0' }}>{task.title}</h4>
                <p style={{ margin: '0', fontSize: '14px', color: '#555' }}>
                  ⏳ Hạn chót: <strong>{task.dueDate}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App