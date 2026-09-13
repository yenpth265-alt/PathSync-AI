package handlers

import (
	"net/http"
	"time"

	"auth-service/database"
	"auth-service/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// recordUserEvent is called from an actual login action (Login, VerifyOTP) —
// never from RefreshAccessToken. A background token refresh is not the user
// doing anything; logging it as activity would inflate retention with
// silent traffic no human generated.
func recordUserEvent(userID, eventType string) {
	database.DB.Create(&models.UserEvent{
		ID:        uuid.NewString(),
		UserID:    userID,
		EventType: eventType,
		CreatedAt: time.Now(),
	})
}

type RetentionBucket struct {
	EligibleUsers int     `json:"eligible_users"` // signed up long enough ago to be measurable
	RetainedUsers int     `json:"retained_users"`
	RetentionRate float64 `json:"retention_rate"` // 0 when EligibleUsers is 0 -- not undefined, not 100%
}

type RetentionSummary struct {
	D7  RetentionBucket `json:"d7"`
	D30 RetentionBucket `json:"d30"`
}

// GetRetentionSummary answers the pitch's "D7 = 34%" style claim from real
// login events instead of asserting a number. Admin-only: this is an
// operational metric, not something every signed-in user needs to see.
func GetRetentionSummary(c *gin.Context) {
	c.JSON(http.StatusOK, RetentionSummary{
		D7:  computeRetention(7),
		D30: computeRetention(30),
	})
}

// computeRetention answers "of users who signed up at least N days ago, what
// fraction logged in again on approximately day N?" A ±1 day window around
// the target day tolerates normal variation in when someone happens to log
// back in without diluting the metric into "logged in at all, ever."
func computeRetention(days int) RetentionBucket {
	const window = 24 * time.Hour

	cutoff := time.Now().AddDate(0, 0, -days)
	var users []models.User
	database.DB.Where("created_at <= ?", cutoff).Find(&users)

	bucket := RetentionBucket{EligibleUsers: len(users)}
	for _, u := range users {
		targetDay := u.CreatedAt.AddDate(0, 0, days)
		var count int64
		database.DB.Model(&models.UserEvent{}).
			Where("user_id = ? AND event_type = ? AND created_at BETWEEN ? AND ?",
				u.ID, "login", targetDay.Add(-window), targetDay.Add(window)).
			Count(&count)
		if count > 0 {
			bucket.RetainedUsers++
		}
	}

	if bucket.EligibleUsers > 0 {
		bucket.RetentionRate = float64(bucket.RetainedUsers) / float64(bucket.EligibleUsers)
	}
	return bucket
}
