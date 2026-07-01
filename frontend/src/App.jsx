import { useState, useEffect, useRef } from 'react'
import ActionExtractor from './components/ActionExtractor'
import Flashcard from './components/Flashcard'
import EssayCopilot from './components/EssayCopilot'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [extractedData, setExtractedData] = useState(null)
  
  const [essayText, setEssayText] = useState('')
  const [aiFeedbacks, setAiFeedbacks] = useState([])
  const ws = useRef(null)
  const chatEndRef = useRef(null)

  const [flashcards, setFlashcards] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080/api/ws/essay')
    ws.current.onopen = () => console.log('✅ Đã kết nối WebSocket!')
    ws.current.onmessage = (event) => setAiFeedbacks((prev) => [...prev, event.data])
    return () => { if (ws.current) ws.current.close() }
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiFeedbacks])

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setExtractedData(null)
    setStatus('')
  }

  const fetchFlashcards = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/flashcards')
      const result = await res.json()
      if (result.data) setFlashcards(result.data)
    } catch (err) {
      console.error("Lỗi lấy flashcards:", err)
    }
  }

  const handleUpload = async () => {
    if (!file) return alert("Vui lòng chọn file!")
    const formData = new FormData()
    formData.append("document", file)

    try {
      setStatus('⏳ Hệ thống AI đang quét tài liệu...')
      const response = await fetch('http://localhost:8080/api/upload', { method: 'POST', body: formData })
      const data = await response.json()
      setStatus(`✅ ${data.message}`)
      if (data.project_data) setExtractedData(data.project_data)
      fetchFlashcards()
    } catch (error) {
      setStatus('❌ Upload thất bại. Kiểm tra kết nối server!')
    }
  }

  const handleReset = () => {
    setFile(null); setStatus(''); setExtractedData(null);
    setFlashcards([]); setCurrentCardIndex(0); setIsFlipped(false);
    document.querySelector('input[type="file"]').value = ''
  }

  const handleEssayTyping = (e) => {
    const text = e.target.value
    setEssayText(text)
    if (text.endsWith('.') && ws.current && ws.current.readyState === WebSocket.OPEN) {
      const sentences = text.split('.')
      const lastSentence = sentences[sentences.length - 2].trim()
      if (lastSentence) ws.current.send(lastSentence)
    }
  }

  const nextCard = () => {
    setIsFlipped(false)
    setTimeout(() => setCurrentCardIndex((prev) => (prev + 1) % flashcards.length), 150)
  }

  const prevCard = () => {
    setIsFlipped(false)
    setTimeout(() => setCurrentCardIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1)), 150)
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
          .flip-card { background-color: transparent; width: 100%; height: 300px; perspective: 1000px; cursor: pointer; }
          .flip-card-inner { position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s; transform-style: preserve-3d; }
          .flip-card.flipped .flip-card-inner { transform: rotateY(180deg); }
          .flip-card-front, .flip-card-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 30px; border: 2px solid #e2e8f0; }
          .flip-card-front { background-color: #ffffff; color: #0f172a; }
          .flip-card-back { background-color: #f8fafc; color: #0f172a; transform: rotateY(180deg); }
        `}
      </style>

      <header style={{ backgroundColor: '#ffffff', padding: '15px 40px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #007bff, #00d2ff)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>P</div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', background: 'linear-gradient(135deg, #007bff, #0056b3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PathSync AI</h1>
        </div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '20px' }}>🟢 System Status: Trực tuyến</div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <ActionExtractor handleFileChange={handleFileChange} handleUpload={handleUpload} handleReset={handleReset} status={status} extractedData={extractedData} />
        <Flashcard flashcards={flashcards} currentCardIndex={currentCardIndex} isFlipped={isFlipped} setIsFlipped={setIsFlipped} prevCard={prevCard} nextCard={nextCard} />
        <EssayCopilot essayText={essayText} handleEssayTyping={handleEssayTyping} aiFeedbacks={aiFeedbacks} chatEndRef={chatEndRef} />
      </main>
    </div>
  )
}

export default App