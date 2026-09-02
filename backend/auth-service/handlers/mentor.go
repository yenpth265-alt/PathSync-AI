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
		if mp.User.Role != "mentor" || !mp.User.IsActive {
			continue // Skip former mentors whose role was changed or account deactivated
		}
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
	MentorID         string  `json:"mentor_id" binding:"required"`
	SlotTime         string  `json:"slot_time" binding:"required"`
	EssayDraft       string  `json:"essay_draft"`
	StudentGPA       float64 `json:"student_gpa"`
	StudentIELTS     string  `json:"student_ielts"`
	TargetUniversity string  `json:"target_university"`
	TargetMajor      string  `json:"target_major"`
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

	// Conflict Check: Ensure no other active booking exists for the same mentor & slot_time
	var conflictCount int64
	database.DB.Model(&models.Booking{}).Where("mentor_id = ? AND slot_time = ? AND status != ?", mentorProfile.UserID, input.SlotTime, "cancelled").Count(&conflictCount)
	if conflictCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Khung giờ này đã được học sinh khác đặt lịch trước. Vui lòng chọn khung giờ khác!"})
		return
	}

	mentorName := mentorProfile.User.FullName
	if mentorName == "" {
		mentorName = "Cố vấn Du học"
	}

	// These used to fall back to specific invented values (GPA 3.8, "IELTS
	// 7.5", "Massachusetts Institute of Technology (MIT)", "Computer Science
	// & AI") whenever the student hadn't provided them — a mentor reading a
	// booking had no way to tell a real submitted GPA from a made-up one.
	// Falling back to the mentee's real onboarding profile is fine (it's
	// real data); falling back further to a specific invented number/name
	// is not, so that second fallback is removed — the field is just left
	// blank, and the frontend shows "not provided" instead of a fake value.
	gpa := input.StudentGPA
	if gpa == 0 {
		gpa = mentee.GPA
	}

	ielts := input.StudentIELTS

	targetUni := input.TargetUniversity

	targetMajor := input.TargetMajor
	if targetMajor == "" {
		targetMajor = mentee.CurrentMajor
	}

	booking := models.Booking{
		ID:               uuid.NewString(),
		MenteeID:         mentee.ID,
		MenteeName:       mentee.FullName,
		MentorID:         mentorProfile.UserID,
		MentorName:       mentorName,
		University:       mentorProfile.University,
		SlotTime:         input.SlotTime,
		Status:           "pending",
		EssayDraft:       input.EssayDraft,
		Price:            mentorProfile.HourlyRate,
		StudentGPA:       gpa,
		StudentIELTS:     ielts,
		TargetUniversity: targetUni,
		TargetMajor:      targetMajor,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
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
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	bookingID := c.Param("id")
	var booking models.Booking
	if err := database.DB.Where("id = ?", bookingID).First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	isMentor := booking.MentorID == userID
	isMentee := booking.MenteeID == userID
	if !isMentor && !isMentee {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	var input UpdateBookingInput
	if err := c.ShouldBindJSON(&input); err == nil {
		oldStatus := booking.Status

		// The mentee side of a booking could previously set any status
		// (including "confirmed"/"completed", as if the mentor had acted) and
		// write arbitrary text into mentor_feedback — nothing distinguished
		// which side sent the request. Only the mentor can confirm/complete a
		// session or leave feedback; the mentee's only allowed transition is
		// cancelling their own pending request.
		if isMentor {
			if input.Status != "" {
				booking.Status = input.Status
			}
			if input.MentorFeedback != "" {
				booking.MentorFeedback = input.MentorFeedback
			}
		} else if isMentee && input.Status == "cancelled" {
			booking.Status = "cancelled"
		}

		booking.UpdatedAt = time.Now()
		database.DB.Save(&booking)

		// Log status transition history
		logRecord := models.BookingHistoryLog{
			ID:        uuid.NewString(),
			BookingID: booking.ID,
			OldStatus: oldStatus,
			NewStatus: booking.Status,
			Note:      input.MentorFeedback,
			CreatedAt: time.Now(),
		}
		database.DB.Create(&logRecord)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking updated successfully", "data": booking})
}

func GetBookingHistory(c *gin.Context) {
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	bookingID := c.Param("id")
	var booking models.Booking
	if err := database.DB.Where("id = ?", bookingID).First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}
	if booking.MentorID != userID && booking.MenteeID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	var history []models.BookingHistoryLog
	database.DB.Where("booking_id = ?", bookingID).Order("created_at desc").Find(&history)
	c.JSON(http.StatusOK, gin.H{"data": history})
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
