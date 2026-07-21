package handlers

import (
	"net/http"
	"application-service/database"
	"application-service/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateSubtaskInput struct {
	Title   string `json:"title" binding:"required"`
	DueDate string `json:"due_date"`
}

func AddSubtask(c *gin.Context) {
	appID := c.Param("app_id")
	var input CreateSubtaskInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	subtask := models.Subtask{
		ID:            uuid.NewString(),
		ApplicationID: appID,
		Title:         input.Title,
		DueDate:       input.DueDate,
	}

	if err := database.DB.Create(&subtask).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add subtask"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": subtask})
}

type ToggleSubtaskInput struct {
	IsCompleted bool `json:"is_completed"`
}

func ToggleSubtask(c *gin.Context) {
	subtaskID := c.Param("id")
	var input ToggleSubtaskInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&models.Subtask{}).Where("id = ?", subtaskID).Update("is_completed", input.IsCompleted).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle subtask"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Subtask updated"})
}
