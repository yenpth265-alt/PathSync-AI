package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"pathsync-backend/internal/db"
	"pathsync-backend/internal/handlers"

	"github.com/gorilla/mux"
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
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// --- Legacy Handlers for MVP Demo ---
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
		time.Sleep(1 * time.Second)
		aiReply := fmt.Sprintf("AI Suggestion: Thay vì dùng cấu trúc này, hãy thử diễn đạt lại ý '%s' để câu văn mang tính học thuật (academic) hơn.", userText)

		err = conn.WriteMessage(messageType, []byte(aiReply))
		if err != nil {
			break
		}
	}
}

func generateFlashcardsHandler(w http.ResponseWriter, r *http.Request) {
	mockFlashcards := `{"status": "success", "data": []}`
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(mockFlashcards))
}

func main() {
	// Khởi tạo Database
	db.InitDB()

	// Khởi tạo Router
	r := mux.NewRouter()

	// REST APIs (Tầng 2 -> Tầng 4)
	r.HandleFunc("/api/applications", handlers.GetApplications).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/applications", handlers.CreateApplication).Methods("POST", "OPTIONS")
	
	r.HandleFunc("/api/tasks", handlers.CreateTask).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/tasks/{id}/toggle", handlers.ToggleTask).Methods("PUT", "OPTIONS")

	// Legacy APIs (Tầng 3 giả lập)
	r.HandleFunc("/api/upload", uploadFileHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/ws/essay", essayChatHandler)
	r.HandleFunc("/api/flashcards", generateFlashcardsHandler).Methods("GET", "OPTIONS")

	fmt.Println("🚀 Server đang chạy tại http://localhost:8080...")
	http.ListenAndServe(":8080", enableCORS(r))
}
