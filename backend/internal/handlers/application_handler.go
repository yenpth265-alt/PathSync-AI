package handlers

import (
	"encoding/json"
	"net/http"
	"pathsync-backend/internal/db"
	"pathsync-backend/internal/models"

	"github.com/gorilla/mux"
)

// Lấy danh sách toàn bộ hồ sơ và tasks con
func GetApplications(w http.ResponseWriter, r *http.Request) {
	var apps []models.Application
	db.DB.Preload("Subtasks").Find(&apps)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apps)
}

// Tạo hồ sơ mới
func CreateApplication(w http.ResponseWriter, r *http.Request) {
	var app models.Application
	if err := json.NewDecoder(r.Body).Decode(&app); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db.DB.Create(&app)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(app)
}

// Tạo task mới cho một hồ sơ
func CreateTask(w http.ResponseWriter, r *http.Request) {
	var task models.Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db.DB.Create(&task)

	// Cập nhật lại số lượng tasks trong Application
	var app models.Application
	db.DB.Preload("Subtasks").First(&app, task.ApplicationID)
	app.TotalTasks = len(app.Subtasks)
	
	// Tính số lượng completed
	completed := 0
	for _, t := range app.Subtasks {
		if t.Completed {
			completed++
		}
	}
	app.Progress = completed
	db.DB.Save(&app)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

// Toggle trạng thái completed của task
func ToggleTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]

	var task models.Task
	if err := db.DB.First(&task, taskID).Error; err != nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	task.Completed = !task.Completed
	db.DB.Save(&task)

	// Cập nhật progress của Application
	var app models.Application
	db.DB.Preload("Subtasks").First(&app, task.ApplicationID)
	completed := 0
	for _, t := range app.Subtasks {
		if t.Completed {
			completed++
		}
	}
	app.Progress = completed
	db.DB.Save(&app)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}
