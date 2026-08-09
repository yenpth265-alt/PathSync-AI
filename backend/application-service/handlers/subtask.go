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

	// 1. Get the subtask to know its ApplicationID
	var subtask models.Subtask
	if err := database.DB.First(&subtask, "id = ?", subtaskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subtask not found"})
		return
	}

	// 2. Update this subtask
	if err := database.DB.Model(&models.Subtask{}).Where("id = ?", subtaskID).Update("is_completed", input.IsCompleted).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle subtask"})
		return
	}

	// 3. Fetch all subtasks for this application to calculate progress
	var allSubtasks []models.Subtask
	database.DB.Where("application_id = ?", subtask.ApplicationID).Find(&allSubtasks)

	total := len(allSubtasks)
	completed := 0
	for _, st := range allSubtasks {
		if st.IsCompleted {
			completed++
		}
	}

	// 4. Auto-update Application status (todo -> inprogress -> completed)
	newStatus := "todo"
	if total > 0 {
		if completed == total {
			newStatus = "completed"
		} else if completed > 0 {
			newStatus = "inprogress"
		}
	}

	// 5. Save new status to the parent Application
	database.DB.Model(&models.Application{}).Where("id = ?", subtask.ApplicationID).Update("status", newStatus)

	c.JSON(http.StatusOK, gin.H{"message": "Subtask updated and progress calculated"})
}
