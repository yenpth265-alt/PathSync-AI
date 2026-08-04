package handlers

import (
	"net/http"
	"strings"
	"time"

	"auth-service/database"
	"auth-service/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MentorResponse struct {
	ID                 string  `json:"id"`
	UserID             string  `json:"user_id"`
	FullName           string  `json:"full_name"`
	Email              string  `json:"email"`
	University         string  `json:"university"`
	Scholarship        string  `json:"scholarship"`
	HourlyRate         int     `json:"hourly_rate"`
	Bio                string  `json:"bio"`
	VerificationStatus string  `json:"verification_status"`
	Rating             float64 `json:"rating"`
	ReviewsCount       int     `json:"reviews_count"`
	CalendarSlots      string  `json:"calendar_slots"`
}

func GetMentors(c *gin.Context) {
	var mentorProfiles []models.MentorProfile
	database.DB.Preload("User").Find(&mentorProfiles)

	var res []MentorResponse
	for _, mp := range mentorProfiles {
		name := mp.User.FullName
		if name == "" {
			name = "Cố vấn Du học"
		}
		res = append(res, MentorResponse{
			ID:                 mp.ID,
			UserID:             mp.UserID,
			FullName:           name,
			Email:              mp.User.Email,
			University:         mp.University,
			Scholarship:        mp.Scholarship,
			HourlyRate:         mp.HourlyRate,
			Bio:                mp.Bio,
			VerificationStatus: mp.VerificationStatus,
			Rating:             mp.Rating,
			ReviewsCount:       mp.ReviewsCount,
			CalendarSlots:      mp.CalendarSlots,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}

type CreateBookingInput struct {
	MentorID   string `json:"mentor_id" binding:"required"`
	SlotTime   string `json:"slot_time" binding:"required"`
	EssayDraft string `json:"essay_draft"`
}

func CreateBooking(c *gin.Context) {
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var mentee models.User
	if err := database.DB.Where("id = ?", userID).First(&mentee).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Mentee user not found"})
		return
	}

	var input CreateBookingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var mentorProfile models.MentorProfile
	if err := database.DB.Where("id = ? OR user_id = ?", input.MentorID, input.MentorID).Preload("User").First(&mentorProfile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Mentor not found"})
		return
	}

	mentorName := mentorProfile.User.FullName
	if mentorName == "" {
		mentorName = "Cố vấn Du học"
	}

	booking := models.Booking{
		ID:            uuid.NewString(),
		MenteeID:      mentee.ID,
		MenteeName:    mentee.FullName,
		MentorID:      mentorProfile.UserID,
		MentorName:    mentorName,
		University:    mentorProfile.University,
		SlotTime:      input.SlotTime,
		Status:        "pending",
		EssayDraft:    input.EssayDraft,
		AiPreFeedback: "AI Mentor Pro: Bài viết có cấu trúc khá rõ ràng. Gợi ý làm nổi bật thêm thành tựu ngoại khóa và động lực chọn ngành.",
		Price:         mentorProfile.HourlyRate,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := database.DB.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking created successfully", "data": booking})
}

func GetBookings(c *gin.Context) {
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

	var bookings []models.Booking
	if user.Role == "mentor" {
		database.DB.Where("mentor_id = ?", user.ID).Order("created_at desc").Find(&bookings)
	} else {
		database.DB.Where("mentee_id = ?", user.ID).Order("created_at desc").Find(&bookings)
	}

	c.JSON(http.StatusOK, gin.H{"data": bookings})
}

type UpdateBookingInput struct {
	Status         string `json:"status"`
	MentorFeedback string `json:"mentor_feedback"`
}

func UpdateBookingStatus(c *gin.Context) {
	bookingID := c.Param("id")
	var booking models.Booking
	if err := database.DB.Where("id = ?", bookingID).First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	var input UpdateBookingInput
	if err := c.ShouldBindJSON(&input); err == nil {
		if input.Status != "" {
			booking.Status = input.Status
		}
		if input.MentorFeedback != "" {
			booking.MentorFeedback = input.MentorFeedback
		}
		booking.UpdatedAt = time.Now()
		database.DB.Save(&booking)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking updated successfully", "data": booking})
}

type UpdateMentorProfileInput struct {
	HourlyRate    int    `json:"hourly_rate"`
	Bio           string `json:"bio"`
	CalendarSlots string `json:"calendar_slots"`
}

func UpdateMentorProfile(c *gin.Context) {
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var mp models.MentorProfile
	if err := database.DB.Where("user_id = ?", userID).First(&mp).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Mentor profile not found"})
		return
	}

	var input UpdateMentorProfileInput
	if err := c.ShouldBindJSON(&input); err == nil {
		if input.HourlyRate > 0 {
			mp.HourlyRate = input.HourlyRate
		}
		if strings.TrimSpace(input.Bio) != "" {
			mp.Bio = input.Bio
		}
		if strings.TrimSpace(input.CalendarSlots) != "" {
			mp.CalendarSlots = input.CalendarSlots
		}
		mp.UpdatedAt = time.Now()
		database.DB.Save(&mp)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Mentor profile updated", "data": mp})
}
