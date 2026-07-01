export default function Flashcard({ flashcards, currentCardIndex, isFlipped, setIsFlipped, prevCard, nextCard }) {
  if (flashcards.length === 0) return null;

  return (
    <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
        <span style={{ fontSize: '24px' }}>🗂️</span> Ôn tập Từ vựng (Auto-Flashcards)
      </h2>
      
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontWeight: '600', marginBottom: '20px' }}>
          Thẻ {currentCardIndex + 1} / {flashcards.length}
        </p>
        
        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
          <div className="flip-card-inner">
            <div className="flip-card-front">
              <h3 style={{ fontSize: '28px', margin: '0', color: '#2563eb' }}>{flashcards[currentCardIndex].term}</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '20px' }}>(Bấm để lật thẻ)</p>
            </div>
            <div className="flip-card-back">
              <p style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 15px 0' }}>{flashcards[currentCardIndex].definition}</p>
              <div style={{ backgroundColor: '#e2e8f0', height: '1px', width: '80%', margin: '0 auto 15px auto' }}></div>
              <p style={{ fontSize: '15px', fontStyle: 'italic', color: '#475569', margin: 0 }}>Ví dụ: "{flashcards[currentCardIndex].example}"</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
          <button onClick={prevCard} className="custom-btn" style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>⬅️ Trước</button>
          <button onClick={nextCard} className="custom-btn" style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>Tiếp ➡️</button>
        </div>
      </div>
    </section>
  )
}