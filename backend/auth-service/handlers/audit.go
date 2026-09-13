package handlers

import (
	"net/http"

	"auth-service/database"
	"auth-service/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// recordAudit writes one row for a sensitive admin action. Best-effort: a
// logging failure must never block the admin action it's describing — the
// action has already committed to the database by the time this is called.
func recordAudit(c *gin.Context, action, targetType, targetID, detail string) {
	entry := models.AuditLog{
		ID:         uuid.NewString(),
		ActorID:    c.GetString("userID"),
		Action:     action,
		TargetType: targetType,
		TargetID:   targetID,
		Detail:     detail,
		IPAddress:  c.ClientIP(),
	}
	database.DB.Create(&entry)
}

// GetAuditLogs lists recorded admin actions, most recent first. Writing an
// audit trail nobody can read is as good as not having one.
func GetAuditLogs(c *gin.Context) {
	var logs []models.AuditLog
	query := database.DB.Order("created_at desc").Limit(200)
	if actorID := c.Query("actor_id"); actorID != "" {
		query = query.Where("actor_id = ?", actorID)
	}
	if targetID := c.Query("target_id"); targetID != "" {
		query = query.Where("target_id = ?", targetID)
	}
	if err := query.Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit logs"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"logs": logs})
}
