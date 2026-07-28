package handlers

import (
	"net/http"
	"strings"
	"time"

	"auth-service/database"
	"auth-service/models"
	"auth-service/utils"

	"github.com/gin-gonic/gin"
)

func getUserIDFromToken(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", http.ErrNoCookie
	}
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", http.ErrNoCookie
	}
	claims, err := utils.ParseToken(parts[1])
	if err != nil {
		return "", err
	}
	userID, ok := claims["user_id"].(string)
	if !ok {
		return "", http.ErrNoCookie
	}
	return userID, nil
}

func GetMyProfile(c *gin.Context) {
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func UpdateMyProfile(c *gin.Context) {
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input models.User
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	user.GPA = input.GPA
	user.WorkExperience = input.WorkExperience
	user.CurrentMajor = input.CurrentMajor
	user.TargetDegree = input.TargetDegree
	user.EducationLevel = input.EducationLevel
	user.TestScores = input.TestScores
	user.FieldsOfInterest = input.FieldsOfInterest
	user.PreferredRegions = input.PreferredRegions
	user.BudgetRange = input.BudgetRange
	user.IntendedYear = input.IntendedYear
	user.IntendedTerm = input.IntendedTerm
	user.JourneyType = input.JourneyType
	user.OnboardingDone = input.OnboardingDone
	user.UpdatedAt = time.Now()

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func GetProfileCompletion(c *gin.Context) {
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	fields := []bool{
		user.GPA > 0,
		user.TargetDegree != "",
		user.EducationLevel != "",
		user.FieldsOfInterest != "[]" && user.FieldsOfInterest != "",
		user.PreferredRegions != "[]" && user.PreferredRegions != "",
		user.BudgetRange != "",
		user.IntendedYear > 0,
		user.IntendedTerm != "",
	}

	completed := 0
	for _, f := range fields {
		if f {
			completed++
		}
	}
	percentage := int((float64(completed) / float64(len(fields))) * 100)

	c.JSON(http.StatusOK, gin.H{"completion_percentage": percentage})
}
