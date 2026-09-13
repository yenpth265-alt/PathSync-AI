package handlers

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"auth-service/database"
	"auth-service/models"
	"auth-service/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupRefreshTestDB(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open in-memory sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.RefreshToken{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	database.DB = db
	gin.SetMode(gin.TestMode)
}

func createTestUser(t *testing.T, isActive bool) models.User {
	t.Helper()
	user := models.User{
		ID:       uuid.NewString(),
		Email:    "student@example.com",
		FullName: "Test Student",
		Role:     "student",
	}
	if err := database.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to create test user: %v", err)
	}
	// IsActive has `gorm:"default:true"` — Create silently skips a false
	// (zero-value) field with a default tag and lets the DB default apply
	// instead, so setting IsActive on the struct above would not actually
	// persist false. A column-scoped Update bypasses that.
	if err := database.DB.Model(&user).Update("is_active", isActive).Error; err != nil {
		t.Fatalf("failed to set is_active: %v", err)
	}
	user.IsActive = isActive
	return user
}

func postRefresh(t *testing.T, refreshToken string) *httptest.ResponseRecorder {
	t.Helper()
	body, _ := json.Marshal(RefreshInput{RefreshToken: refreshToken})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	RefreshAccessToken(c)
	return w
}

func TestIssueTokenPair_CreatesUsableRefreshToken(t *testing.T) {
	setupRefreshTestDB(t)
	user := createTestUser(t, true)

	access, refresh, err := issueTokenPair(user)
	if err != nil {
		t.Fatalf("issueTokenPair returned error: %v", err)
	}
	if access == "" || refresh == "" {
		t.Fatal("expected non-empty access and refresh tokens")
	}

	var stored models.RefreshToken
	if err := database.DB.Where("user_id = ?", user.ID).First(&stored).Error; err != nil {
		t.Fatalf("expected a RefreshToken row to be persisted: %v", err)
	}
	if stored.TokenHash == refresh {
		t.Error("the raw refresh token must never be stored as-is, only its hash")
	}
	if stored.Revoked {
		t.Error("a freshly issued refresh token must not start revoked")
	}
}

func TestRefreshAccessToken_ValidToken_RotatesAndSucceeds(t *testing.T) {
	setupRefreshTestDB(t)
	user := createTestUser(t, true)
	_, refresh, _ := issueTokenPair(user)

	w := postRefresh(t, refresh)

	if w.Code != 200 {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["token"] == "" || resp["refresh_token"] == "" {
		t.Fatalf("expected new token pair in response, got %v", resp)
	}
	if resp["refresh_token"] == refresh {
		t.Error("rotation must issue a NEW refresh token, not return the same one")
	}
}

func TestRefreshAccessToken_OldTokenIsRevokedAfterRotation(t *testing.T) {
	setupRefreshTestDB(t)
	user := createTestUser(t, true)
	_, refresh, _ := issueTokenPair(user)

	postRefresh(t, refresh) // first use: rotates successfully

	var stored models.RefreshToken
	database.DB.Where("token_hash = ?", utils.HashRefreshToken(refresh)).First(&stored)
	if !stored.Revoked {
		t.Fatal("the original refresh token must be marked revoked after being exchanged")
	}
}

func TestRefreshAccessToken_RevokedTokenReuse_Refused(t *testing.T) {
	setupRefreshTestDB(t)
	user := createTestUser(t, true)
	_, refresh, _ := issueTokenPair(user)

	postRefresh(t, refresh)      // first use — legitimate rotation
	w := postRefresh(t, refresh) // reuse of an already-rotated token

	if w.Code != 401 {
		t.Fatalf("expected 401 on reuse of an already-revoked refresh token, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRefreshAccessToken_ExpiredToken_Refused(t *testing.T) {
	setupRefreshTestDB(t)
	user := createTestUser(t, true)

	token, tokenHash, _ := utils.NewRefreshToken()
	database.DB.Create(&models.RefreshToken{
		ID:        uuid.NewString(),
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(-1 * time.Hour), // already expired
	})

	w := postRefresh(t, token)

	if w.Code != 401 {
		t.Fatalf("expected 401 for an expired refresh token, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRefreshAccessToken_UnknownToken_Refused(t *testing.T) {
	setupRefreshTestDB(t)
	createTestUser(t, true)

	w := postRefresh(t, "this-token-was-never-issued")

	if w.Code != 401 {
		t.Fatalf("expected 401 for an unrecognized refresh token, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRefreshAccessToken_DisabledAccount_Refused(t *testing.T) {
	setupRefreshTestDB(t)
	user := createTestUser(t, false) // disabled
	_, refresh, _ := issueTokenPair(user)

	w := postRefresh(t, refresh)

	if w.Code != 403 {
		t.Fatalf("expected 403 for a disabled account, got %d: %s", w.Code, w.Body.String())
	}
}
