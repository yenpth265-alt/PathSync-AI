package handlers

import (
	"net/http/httptest"
	"strings"
	"testing"

	"auth-service/database"
	"auth-service/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open in-memory sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.AuditLog{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	database.DB = db
}

func newTestGinContext(t *testing.T, userID string) (*gin.Context, *httptest.ResponseRecorder) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil) // ClientIP() needs a real request
	c.Set("userID", userID)
	return c, w
}

func TestRecordAudit_WritesActorActionAndDetail(t *testing.T) {
	setupTestDB(t)
	c, _ := newTestGinContext(t, "admin-123")

	recordAudit(c, "user.role_updated", "user", "target-456", `{"old_role":"student","new_role":"mentor"}`)

	var logs []models.AuditLog
	database.DB.Find(&logs)
	if len(logs) != 1 {
		t.Fatalf("expected 1 audit log row, got %d", len(logs))
	}
	entry := logs[0]
	if entry.ActorID != "admin-123" {
		t.Errorf("ActorID = %q, want admin-123", entry.ActorID)
	}
	if entry.Action != "user.role_updated" {
		t.Errorf("Action = %q, want user.role_updated", entry.Action)
	}
	if entry.TargetID != "target-456" {
		t.Errorf("TargetID = %q, want target-456", entry.TargetID)
	}
	if entry.Detail == "" {
		t.Error("expected Detail to be recorded, got empty string")
	}
	if entry.ID == "" {
		t.Error("expected a generated ID, got empty string")
	}
}

func TestGetAuditLogs_FiltersByTargetID(t *testing.T) {
	setupTestDB(t)
	c, _ := newTestGinContext(t, "admin-123")

	recordAudit(c, "user.role_updated", "user", "target-A", "{}")
	recordAudit(c, "user.deleted", "user", "target-B", "{}")

	w := httptest.NewRecorder()
	reqCtx, _ := gin.CreateTestContext(w)
	req := httptest.NewRequest("GET", "/admin/audit-logs?target_id=target-A", nil)
	reqCtx.Request = req

	GetAuditLogs(reqCtx)

	if w.Code != 200 {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), "target-A") {
		t.Errorf("response should contain target-A, got %s", w.Body.String())
	}
	if strings.Contains(w.Body.String(), "target-B") {
		t.Errorf("response should NOT contain target-B when filtered by target_id=target-A, got %s", w.Body.String())
	}
}
