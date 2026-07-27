package handlers

import (
	"net/http"
	"application-service/database"
	"application-service/models"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Get all applications
func GetApplications(c *gin.Context) {
	var applications []models.Application
	
	database.DB.Preload("Subtasks").Find(&applications)

	c.JSON(http.StatusOK, gin.H{"data": applications})
}

type CreateAppInput struct {
	UserID          string `json:"user_id" binding:"required"`
	UniversityID    string `json:"university_id" binding:"required"`
	UniversityName  string `json:"university_name" binding:"required"`
	Deadline        string `json:"deadline" binding:"required"`
	ApplicationType string `json:"application_type" binding:"required"`
}

func CreateApplication(c *gin.Context) {
	var input CreateAppInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	app := models.Application{
		ID:              uuid.NewString(),
		UserID:          input.UserID,
		UniversityID:    input.UniversityID,
		UniversityName:  input.UniversityName,
		Status:          "todo",
		Deadline:        input.Deadline,
		ApplicationType: input.ApplicationType,
	}

	if err := database.DB.Create(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create application"})
		return
	}

	// Create default subtasks
	defaultSubtasks := []models.Subtask{
		{ID: uuid.NewString(), ApplicationID: app.ID, Title: "Draft Personal Statement"},
		{ID: uuid.NewString(), ApplicationID: app.ID, Title: "Request Letters of Recommendation"},
		{ID: uuid.NewString(), ApplicationID: app.ID, Title: "Submit Transcripts"},
	}
	database.DB.Create(&defaultSubtasks)
	app.Subtasks = defaultSubtasks

	c.JSON(http.StatusOK, gin.H{"data": app})
}

type UpdateStatusInput struct {
	Status string `json:"status" binding:"required"`
}

func UpdateApplicationStatus(c *gin.Context) {
	appID := c.Param("id")
	var input UpdateStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&models.Application{}).Where("id = ?", appID).Update("status", input.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

type UpdateDetailsInput struct {
	Notes         string `json:"notes"`
	Deadline      string `json:"deadline"`
	AttachmentURL string `json:"attachment_url"`
}

func UpdateApplicationDetails(c *gin.Context) {
	appID := c.Param("id")
	var input UpdateDetailsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if input.Notes != "" {
		updates["notes"] = input.Notes
	}
	if input.Deadline != "" {
		updates["deadline"] = input.Deadline
	}
	if input.AttachmentURL != "" {
		updates["attachment_url"] = input.AttachmentURL
	}

	if err := database.DB.Model(&models.Application{}).Where("id = ?", appID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update details"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Details updated successfully"})
}

func DeleteApplication(c *gin.Context) {
	appID := c.Param("id")
	database.DB.Where("application_id = ?", appID).Delete(&models.Subtask{})
	if err := database.DB.Where("id = ?", appID).Delete(&models.Application{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application deleted successfully"})
}

func GetMetrics(c *gin.Context) {
	var applications []models.Application
	database.DB.Preload("Subtasks").Find(&applications)

	totalSchools := len(applications)
	totalTasks := 0
	completedTasks := 0
	
	statusCounts := map[string]int{
		"todo": 0,
		"in-progress": 0,
		"done": 0,
	}

	var nextDeadlineApp *models.Application
	now := time.Now()

	for _, app := range applications {
		statusCounts[app.Status]++
		totalTasks += len(app.Subtasks)
		for _, task := range app.Subtasks {
			if task.IsCompleted {
				completedTasks++
			}
		}

		// Parse deadline
		if app.Deadline != "" {
			deadlineTime, err := time.Parse("2006-01-02", app.Deadline)
			if err == nil && deadlineTime.After(now) {
				if nextDeadlineApp == nil {
					nextDeadlineApp = &app
				} else {
					currentNextTime, _ := time.Parse("2006-01-02", nextDeadlineApp.Deadline)
					if deadlineTime.Before(currentNextTime) {
						nextDeadlineApp = &app
					}
				}
			}
		}
	}

	readiness := 0
	if totalTasks > 0 {
		readiness = (completedTasks * 100) / totalTasks
	}

	var nextDeadlineData interface{}
	if nextDeadlineApp != nil {
		parsedTime, err := time.Parse("2006-01-02", nextDeadlineApp.Deadline)
		if err == nil {
			daysLeft := int(parsedTime.Sub(now).Hours() / 24)
			nextDeadlineData = gin.H{
				"university": nextDeadlineApp.UniversityName,
				"type":       nextDeadlineApp.ApplicationType,
				"days_left":  daysLeft,
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"target_schools": totalSchools,
		"overall_readiness": readiness,
		"task_status": gin.H{
			"todo": statusCounts["todo"],
			"in_progress": statusCounts["in-progress"],
			"completed": statusCounts["done"],
		},
		"next_deadline": nextDeadlineData,
	})
}

type ReviewEssayInput struct {
	Essay  string `json:"essay"`
	Prompt string `json:"prompt"`
}

func ReviewEssay(c *gin.Context) {
	var input ReviewEssayInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	essay := input.Essay
	prompt := input.Prompt

	var feedback string
	wordCount := 0
	for _, word := range strings.Fields(essay) {
		if word != "" {
			wordCount++
		}
	}

	if wordCount < 50 {
		feedback = "Your essay draft is quite short (" + strconv.Itoa(wordCount) + " words). Try expanding on a specific anecdote or achievement that demonstrates your leadership or passion."
	} else if strings.Contains(strings.ToLower(essay), "passionate") || strings.Contains(strings.ToLower(essay), "always wanted") {
		feedback = "Good draft! However, try to avoid clichés like 'passionate' or 'always wanted'. Instead, 'show, don't tell' by describing a concrete obstacle you overcame or a project that sparked your curiosity."
	} else if prompt != "" && strings.Contains(strings.ToLower(prompt), "leadership") && !strings.Contains(strings.ToLower(essay), "lead") && !strings.Contains(strings.ToLower(essay), "team") {
		feedback = "Your writing style is strong (" + strconv.Itoa(wordCount) + " words), but remember to directly address the prompt regarding leadership. Mention how you guided a team or took initiative."
	} else {
		feedback = "Great job! Your structure is solid (" + strconv.Itoa(wordCount) + " words) and avoids common clichés. To make it even stronger, ensure your concluding paragraph clearly ties your past experiences to your future goals at the target university."
	}

	c.JSON(http.StatusOK, gin.H{
		"feedback":   feedback,
		"word_count": wordCount,
		"status":     "analyzed",
	})
}
