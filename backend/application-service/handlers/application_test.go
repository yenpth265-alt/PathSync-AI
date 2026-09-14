package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"application-service/database"
	"application-service/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) {
	dbFile := "test_application.db"
	os.Remove(dbFile)

	db, err := gorm.Open(sqlite.Open(dbFile), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	if err := db.AutoMigrate(&models.Application{}, &models.Subtask{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	database.DB = db

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			sqlDB.Close()
		}
		os.Remove(dbFile)
	})
}

// A program the crawler found rarely has a published deadline (most crawled
// listing pages just name the program). Requiring one at the API boundary
// forced the frontend to invent a fake date, which a student would mistake
// for the real deadline. This confirms the field is genuinely optional now.
func TestCreateApplication_EmptyDeadlineAccepted(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", "test-user")
		c.Next()
	})
	router.POST("/applications", CreateApplication)

	body, _ := json.Marshal(map[string]string{
		"university_id":    "uni-1",
		"university_name":  "RMIT University Vietnam",
		"country":          "Vietnam",
		"deadline":         "",
		"application_type": "Regular Decision",
	})

	req := httptest.NewRequest(http.MethodPost, "/applications", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK && w.Code != http.StatusCreated {
		t.Fatalf("expected success creating an application with no published deadline, got %d: %s", w.Code, w.Body.String())
	}

	var apps []models.Application
	database.DB.Find(&apps)
	if len(apps) != 1 {
		t.Fatalf("expected 1 application stored, got %d", len(apps))
	}
	if apps[0].Deadline != "" {
		t.Errorf("expected empty deadline to be stored as-is, got %q", apps[0].Deadline)
	}
}

func TestCreateApplication_MissingUniversityIDStillRejected(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", "test-user")
		c.Next()
	})
	router.POST("/applications", CreateApplication)

	body, _ := json.Marshal(map[string]string{
		"university_name":  "RMIT University Vietnam",
		"application_type": "Regular Decision",
	})

	req := httptest.NewRequest(http.MethodPost, "/applications", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 when university_id is missing, got %d: %s", w.Code, w.Body.String())
	}
}
