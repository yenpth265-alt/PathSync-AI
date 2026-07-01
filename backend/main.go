package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

// Middleware xử lý CORS
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

// Handler nhận file
func uploadFileHandler(w http.ResponseWriter, r *http.Request) {
	// Giới hạn kích thước file (ví dụ: 10MB)
	r.ParseMultipartForm(10 << 20)

	file, handler, err := r.FormFile("document")
	if err != nil {
		http.Error(w, "Error retrieving the file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Tạo thư mục uploads nếu chưa có
	os.MkdirAll("uploads", os.ModePerm)

	// Tạo file mới trên server
	dst, err := os.Create(filepath.Join("uploads", handler.Filename))
	if err != nil {
		http.Error(w, "Error saving the file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy nội dung file
	io.Copy(dst, file)

	fmt.Printf("Đã nhận và lưu file thành công: %s\n", handler.Filename)

	// Trả về JSON mock báo thành công
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "success", "message": "File uploaded successfully!"}`))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/upload", uploadFileHandler)

	fmt.Println("Server đang chạy tại http://localhost:8080...")
	http.ListenAndServe(":8080", enableCORS(mux))
}
