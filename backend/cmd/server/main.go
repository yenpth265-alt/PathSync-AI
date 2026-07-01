package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/websocket"
	"github.com/ledongthuc/pdf"
)

// Hàm đọc và bóc tách chữ từ file PDF
func extractTextFromPDF(pdfPath string) (string, error) {
	f, r, err := pdf.Open(pdfPath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	var buf bytes.Buffer
	b, err := r.GetPlainText()
	if err != nil {
		return "", err
	}

	buf.ReadFrom(b)
	return buf.String(), nil
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func uploadFileHandler(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(10 << 20)
	file, handler, err := r.FormFile("document")
	if err != nil {
		http.Error(w, "Error retrieving the file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	os.MkdirAll("uploads", os.ModePerm)
	savedFilePath := filepath.Join("uploads", handler.Filename)
	dst, err := os.Create(savedFilePath)

	if err != nil {
		http.Error(w, "Error saving the file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	io.Copy(dst, file)

	fmt.Printf("✅ Đã lưu file: %s\n", handler.Filename)

	// Đọc PDF ngay sau khi lưu ---
	if filepath.Ext(handler.Filename) == ".pdf" {
		fmt.Println("⏳ Đang trích xuất văn bản từ PDF...")
		text, err := extractTextFromPDF(savedFilePath)
		if err != nil {
			fmt.Println("❌ Lỗi đọc PDF:", err)
		} else {
			snippet := text
			if len(text) > 500 {
				snippet = text[:500] + "..."
			}
			fmt.Printf("📄 Bóc tách thành công! Trích xuất nội dung:\n---\n%s\n---\n", snippet)
		}
	} else {
		fmt.Println("⚠️ File không phải định dạng PDF, bỏ qua bước bóc tách chữ.")
	}

	mockAIResponse := `
	{
		"status": "success",
		"message": "Trích xuất Action Extractor thành công!",
		"project_data": {
			"target": "Học bổng ĐH Melbourne - CS",
			"tasks": [
				{"id": 1, "title": "Nộp bảng điểm (Transcript)", "dueDate": "15/08/2026", "urgency": "red"},
				{"id": 2, "title": "Thi & Nộp IELTS >= 6.5", "dueDate": "01/09/2026", "urgency": "yellow"},
				{"id": 3, "title": "Thư giới thiệu từ Giáo sư", "dueDate": "10/09/2026", "urgency": "green"}
			]
		}
	}`

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(mockAIResponse))
}

func essayChatHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Lỗi nâng cấp WebSocket:", err)
		return
	}
	defer conn.Close()

	fmt.Println("🔗 Đã kết nối WebSocket với Frontend!")

	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Client ngắt kết nối hoặc có lỗi:", err)
			break
		}

		userText := string(p)
		fmt.Printf("Nhận được text: %s\n", userText)

		time.Sleep(1 * time.Second)
		aiReply := fmt.Sprintf("AI Suggestion: Thay vì dùng cấu trúc này, hãy thử diễn đạt lại ý '%s' để câu văn mang tính học thuật (academic) hơn.", userText)

		err = conn.WriteMessage(messageType, []byte(aiReply))
		if err != nil {
			fmt.Println("Lỗi gửi tin nhắn WebSocket:", err)
			break
		}
	}
}

func generateFlashcardsHandler(w http.ResponseWriter, r *http.Request) {
	mockFlashcards := `
	{
		"status": "success",
		"data": [
			{
				"id": 1,
				"term": "Extracurricular Activities",
				"definition": "Hoạt động ngoại khóa (không nằm trong chương trình học chính thức).",
				"example": "Leadership in extracurricular activities is highly valued by admissions."
			},
			{
				"id": 2,
				"term": "Personal Statement",
				"definition": "Bài luận cá nhân để thể hiện động lực và sự phù hợp với ngành học.",
				"example": "Your personal statement should reflect your unique journey."
			},
			{
				"id": 3,
				"term": "Letter of Recommendation",
				"definition": "Thư giới thiệu từ giáo viên hoặc người quản lý.",
				"example": "Submit three letters of recommendation by the deadline."
			}
		]
	}`

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(mockFlashcards))
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/upload", uploadFileHandler)
	mux.HandleFunc("/api/ws/essay", essayChatHandler)
	mux.HandleFunc("/api/flashcards", generateFlashcardsHandler)

	fmt.Println("🚀 Server đang chạy tại http://localhost:8080...")
	http.ListenAndServe(":8080", enableCORS(mux))
}
