package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
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
	c.JSON(http.StatusOK, gin.H{"data": user})
}

type UpdateProfileInput struct {
	FullName       string      `json:"full_name"`
	GPA            *float64    `json:"gpa"`
	WorkExperience *int        `json:"work_experience"`
	CurrentMajor   string      `json:"current_major"`
	TargetDegree   string      `json:"target_degree"`
	EducationLevel string      `json:"education_level"`
	TestScores     string      `json:"test_scores"`
	BudgetRange    string      `json:"budget_range"`
	IntendedTerm   string      `json:"intended_term"`
	JourneyType    string      `json:"journey_type"`
	OnboardingDone *bool       `json:"onboarding_done"`
	IntendedYear   interface{} `json:"intended_year"`

	// Frontend onboarding aliases
	Fields     []string    `json:"fields"`
	Regions    []string    `json:"regions"`
	IntakeYear interface{} `json:"intake_year"`
	Term       string      `json:"term"`
	Budget     string      `json:"budget"`

	FieldsOfInterest json.RawMessage `json:"fields_of_interest"`
	PreferredRegions json.RawMessage `json:"preferred_regions"`
}

func encodeStringSlice(value json.RawMessage, fallback []string) string {
	if len(value) > 0 && string(value) != "null" {
		return string(value)
	}
	if len(fallback) > 0 {
		encoded, err := json.Marshal(fallback)
		if err == nil {
			return string(encoded)
		}
	}
	return "[]"
}

func parseIntendedYear(value interface{}) int {
	switch v := value.(type) {
	case float64:
		return int(v)
	case int:
		return v
	case string:
		if parsed, err := strconv.Atoi(v); err == nil {
			return parsed
		}
	}
	return 0
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

	var input UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.FullName != "" {
		user.FullName = input.FullName
	}
	if input.GPA != nil {
		user.GPA = *input.GPA
	}
	if input.WorkExperience != nil {
		user.WorkExperience = *input.WorkExperience
	}
	if input.CurrentMajor != "" {
		user.CurrentMajor = input.CurrentMajor
	}
	if input.TargetDegree != "" {
		user.TargetDegree = input.TargetDegree
	}
	if input.EducationLevel != "" {
		user.EducationLevel = input.EducationLevel
	}
	if input.TestScores != "" {
		user.TestScores = input.TestScores
	}
	if input.JourneyType != "" {
		user.JourneyType = input.JourneyType
	}
	if input.OnboardingDone != nil {
		user.OnboardingDone = *input.OnboardingDone
	}

	budget := input.BudgetRange
	if budget == "" {
		budget = input.Budget
	}
	if budget != "" {
		user.BudgetRange = budget
	}

	term := input.IntendedTerm
	if term == "" {
		term = input.Term
	}
	if term != "" {
		user.IntendedTerm = term
	}

	year := parseIntendedYear(input.IntendedYear)
	if year == 0 {
		year = parseIntendedYear(input.IntakeYear)
	}
	if year > 0 {
		user.IntendedYear = year
	}

	user.FieldsOfInterest = encodeStringSlice(input.FieldsOfInterest, input.Fields)
	user.PreferredRegions = encodeStringSlice(input.PreferredRegions, input.Regions)

	user.UpdatedAt = time.Now()

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
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
