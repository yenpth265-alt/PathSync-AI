import { useState } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Vui lòng chọn file trước!")
      return
    }

    const formData = new FormData()
    formData.append("document", file)

    try {
      setStatus('Đang upload...')
      const response = await fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      setStatus(`Kết quả: ${data.message}`)
    } catch (error) {
      console.error("Lỗi:", error)
      setStatus('Upload thất bại! Kiểm tra lại server.')
    }
  }

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>PathSync AI - Action Extractor Demo</h1>
      <p>Test luồng đẩy file PDF/Ảnh brochure tuyển sinh</p>
      
      <div style={{ marginBottom: '20px' }}>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} style={{ marginLeft: '10px', padding: '5px 15px' }}>
          Tự động bóc tách (Upload)
        </button>
      </div>

      <h3 style={{ color: 'blue' }}>{status}</h3>
    </div>
  )
}

export default App