package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/websocket"
)

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
	dst, err := os.Create(filepath.Join("uploads", handler.Filename))
	if err != nil {
		http.Error(w, "Error saving the file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	io.Copy(dst, file)

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

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/upload", uploadFileHandler)
	mux.HandleFunc("/api/ws/essay", essayChatHandler)

	fmt.Println("🚀 Server đang chạy tại http://localhost:8080...")
	http.ListenAndServe(":8080", enableCORS(mux))
}
