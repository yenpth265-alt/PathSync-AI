package handlers

import (
	"testing"
	"time"

	"auth-service/database"
	"auth-service/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupAnalyticsTestDB(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open in-memory sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.UserEvent{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	database.DB = db
	gin.SetMode(gin.TestMode)
}

func createUserSignedUpDaysAgo(t *testing.T, daysAgo int) models.User {
	t.Helper()
	user := models.User{
		ID:       uuid.NewString(),
		Email:    uuid.NewString() + "@example.com",
		FullName: "Test User",
		Role:     "student",
	}
	if err := database.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}
	// CreatedAt is auto-set by GORM on Create; backdate it with a raw update
	// since the field has no `default` tag getting in the way this time, but
	// a plain struct Save would also work here -- using Update for clarity.
	createdAt := time.Now().AddDate(0, 0, -daysAgo)
	database.DB.Model(&user).Update("created_at", createdAt)
	user.CreatedAt = createdAt
	return user
}

func TestComputeRetention_UserWhoLoggedBackOnDay7_CountsAsRetained(t *testing.T) {
	setupAnalyticsTestDB(t)

	user := createUserSignedUpDaysAgo(t, 10) // eligible for D7 (signed up >=7 days ago)
	database.DB.Create(&models.UserEvent{
		ID:        uuid.NewString(),
		UserID:    user.ID,
		EventType: "login",
		CreatedAt: user.CreatedAt.AddDate(0, 0, 7), // logged in again exactly on day 7
	})

	bucket := computeRetention(7)

	if bucket.EligibleUsers != 1 {
		t.Fatalf("EligibleUsers = %d, want 1", bucket.EligibleUsers)
	}
	if bucket.RetainedUsers != 1 {
		t.Errorf("RetainedUsers = %d, want 1", bucket.RetainedUsers)
	}
	if bucket.RetentionRate != 1.0 {
		t.Errorf("RetentionRate = %v, want 1.0", bucket.RetentionRate)
	}
}

func TestComputeRetention_UserWhoNeverCameBack_NotCountedRetained(t *testing.T) {
	setupAnalyticsTestDB(t)

	createUserSignedUpDaysAgo(t, 10) // no login events at all besides implicit signup

	bucket := computeRetention(7)

	if bucket.EligibleUsers != 1 {
		t.Fatalf("EligibleUsers = %d, want 1", bucket.EligibleUsers)
	}
	if bucket.RetainedUsers != 0 {
		t.Errorf("RetainedUsers = %d, want 0 -- a user with no login event must not count as retained", bucket.RetainedUsers)
	}
	if bucket.RetentionRate != 0 {
		t.Errorf("RetentionRate = %v, want 0", bucket.RetentionRate)
	}
}

func TestComputeRetention_TooRecentSignup_NotYetEligible(t *testing.T) {
	setupAnalyticsTestDB(t)

	createUserSignedUpDaysAgo(t, 2) // signed up 2 days ago -- can't have reached day 7 yet

	bucket := computeRetention(7)

	if bucket.EligibleUsers != 0 {
		t.Errorf("EligibleUsers = %d, want 0 -- a user who signed up 2 days ago hasn't reached day 7 yet", bucket.EligibleUsers)
	}
}

func TestComputeRetention_LoginOutsideWindow_NotCountedRetained(t *testing.T) {
	setupAnalyticsTestDB(t)

	user := createUserSignedUpDaysAgo(t, 10)
	// Logged in on day 20, nowhere near day 7 -- must not inflate D7.
	database.DB.Create(&models.UserEvent{
		ID:        uuid.NewString(),
		UserID:    user.ID,
		EventType: "login",
		CreatedAt: user.CreatedAt.AddDate(0, 0, 20),
	})

	bucket := computeRetention(7)

	if bucket.RetainedUsers != 0 {
		t.Errorf("RetainedUsers = %d, want 0 -- a day-20 login should not count toward D7 retention", bucket.RetainedUsers)
	}
}

func TestComputeRetention_NoEligibleUsers_RateIsZeroNotNaN(t *testing.T) {
	setupAnalyticsTestDB(t)

	bucket := computeRetention(7)

	if bucket.EligibleUsers != 0 || bucket.RetentionRate != 0 {
		t.Errorf("expected {0, 0, 0} with no users at all, got %+v", bucket)
	}
}
