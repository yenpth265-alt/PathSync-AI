package handlers

import (
	"net/http"
	"auth-service/database"
	"auth-service/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetProfile(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	var profile models.UserProfile
	err := database.DB.Where("user_id = ?", userID).First(&profile).Error
	if err == gorm.ErrRecordNotFound {
		// Create default profile for the user
		profile = models.UserProfile{
			ID:            uuid.NewString(),
			UserID:        userID,
			GPA:           3.8,
			IELTS:         "IELTS 7.5",
			SATScore:      1450,
			TargetMajor:   "Computer Science",
			TargetCountry: "United States",
			HighSchool:    "High School for Gifted Students",
			Budget:        "$30,000 / year",
			Bio:           "Aspiring software engineer passionate about AI and systems design.",
			UpdatedAt:     time.Now(),
		}
		database.DB.Create(&profile)
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": profile})
}

func UpdateProfile(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	var input models.UserProfile
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing models.UserProfile
	err := database.DB.Where("user_id = ?", userID).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		input.ID = uuid.NewString()
		input.UserID = userID
		input.UpdatedAt = time.Now()
		if err := database.DB.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create profile"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": input, "message": "Profile created successfully"})
		return
	}

	existing.GPA = input.GPA
	existing.IELTS = input.IELTS
	existing.SATScore = input.SATScore
	existing.TargetMajor = input.TargetMajor
	existing.TargetCountry = input.TargetCountry
	existing.HighSchool = input.HighSchool
	existing.Budget = input.Budget
	existing.Bio = input.Bio
	existing.UpdatedAt = time.Now()

	if err := database.DB.Save(&existing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": existing, "message": "Profile updated successfully"})
}
