package handlers

import (
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"time"

	"auth-service/database"
	"auth-service/models"
	"auth-service/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// otpDebugEnabled controls whether the raw OTP code is echoed back in the
// send-otp response. There is currently no real email provider wired up, so
// this defaults to on (otherwise nobody could ever complete registration).
// Set EXPOSE_OTP_DEBUG=false once real email delivery is integrated — leaving
// this on in production lets anyone who knows a victim's email hijack their
// (unverified) account without ever receiving the email.
func otpDebugEnabled() bool {
	return os.Getenv("EXPOSE_OTP_DEBUG") != "false"
}

type SendOTPInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
}

func SendOTP(c *gin.Context) {
	var input SendOTPInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingUser models.User
	err := database.DB.Where("email = ?", input.Email).First(&existingUser).Error
	if err == nil {
		if existingUser.IsVerified {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already registered and verified"})
			return
		}
		// Update OTP for unverified existing user
		otp := fmt.Sprintf("%06d", rand.Intn(1000000))
		hash, _ := utils.HashPassword(input.Password)
		existingUser.PasswordHash = hash
		existingUser.FullName = input.FullName
		existingUser.OTPCode = otp
		existingUser.OTPExpiresAt = time.Now().Add(10 * time.Minute)
		database.DB.Save(&existingUser)

		resp := gin.H{"message": "OTP sent successfully", "email": input.Email}
		if otpDebugEnabled() {
			resp["otp_debug"] = otp
		}
		c.JSON(http.StatusOK, resp)
		return
	}

	// Create new unverified user
	otp := fmt.Sprintf("%06d", rand.Intn(1000000))
	hash, _ := utils.HashPassword(input.Password)
	user := models.User{
		ID:           uuid.NewString(),
		Email:        input.Email,
		PasswordHash: hash,
		FullName:     input.FullName,
		Role:         "student",
		IsVerified:   false,
		IsActive:     true,
		OTPCode:      otp,
		OTPExpiresAt: time.Now().Add(10 * time.Minute),
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate registration"})
		return
	}

	resp := gin.H{"message": "OTP sent successfully to email", "email": input.Email}
	if otpDebugEnabled() {
		resp["otp_debug"] = otp
	}
	c.JSON(http.StatusOK, resp)
}

type VerifyOTPInput struct {
	Email   string `json:"email" binding:"required,email"`
	OTPCode string `json:"otp_code" binding:"required"`
}

func VerifyOTP(c *gin.Context) {
	var input VerifyOTPInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registration record not found"})
		return
	}

	if user.IsVerified {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Account is already verified"})
		return
	}

	if user.OTPCode != input.OTPCode {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OTP code"})
		return
	}

	if time.Now().After(user.OTPExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OTP has expired. Please request a new one"})
		return
	}

	// Activate user
	user.IsVerified = true
	user.OTPCode = ""
	database.DB.Save(&user)

	token, err := utils.GenerateToken(user.ID, user.Email, user.FullName, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Verification successful",
		"token":   token,
		"user":    user,
	})
}

func Register(c *gin.Context) {
	SendOTP(c)
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Your account has been disabled by admin"})
		return
	}

	if !utils.CheckPasswordHash(input.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Email, user.FullName, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user":    user,
	})
}

// Admin Handlers
func GetAdminUsers(c *gin.Context) {
	var users []models.User
	if err := database.DB.Order("created_at desc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"users": users})
}

type UpdateRoleInput struct {
	Role string `json:"role" binding:"required,oneof=student mentor admin"`
}

func UpdateUserRole(c *gin.Context) {
	id := c.Param("id")
	var input UpdateRoleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.Role = input.Role
	user.UpdatedAt = time.Now()
	database.DB.Save(&user)

	if input.Role == "mentor" {
		var mp models.MentorProfile
		if err := database.DB.Where("user_id = ?", user.ID).First(&mp).Error; err != nil {
			newMp := models.MentorProfile{
				ID:                 uuid.NewString(),
				UserID:             user.ID,
				University:         "Trường Đại Học Đối Tác",
				Scholarship:        "Cố vấn Học bổng Toàn Phần",
				HourlyRate:         120000,
				Bio:                "Cố vấn du học chuyên tư vấn hồ sơ và chiến lược săn học bổng.",
				VerificationStatus: "verified",
				Rating:             5.0,
				ReviewsCount:       10,
				CalendarSlots:      `["T2 19:00", "T4 20:00", "T6 18:30", "CN 10:00"]`,
				CreatedAt:          time.Now(),
				UpdatedAt:          time.Now(),
			}
			database.DB.Create(&newMp)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role updated successfully", "user": user})
}

type UpdateStatusInput struct {
	IsActive bool `json:"is_active"`
}

func UpdateUserStatus(c *gin.Context) {
	id := c.Param("id")
	var input UpdateStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.IsActive = input.IsActive
	database.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{"message": "User status updated successfully", "user": user})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Soft delete (models.User has a DeletedAt column): GORM stamps
	// deleted_at instead of removing the row, so this can be undone with
	// RestoreUser instead of requiring a database backup.
	database.DB.Delete(&user)
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetDeletedUsers lists soft-deleted accounts so an admin can review and
// restore them if a deletion was accidental or malicious.
func GetDeletedUsers(c *gin.Context) {
	var users []models.User
	if err := database.DB.Unscoped().Where("deleted_at IS NOT NULL").Order("deleted_at desc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deleted users"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"users": users})
}

// RestoreUser undoes a soft delete.
func RestoreUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := database.DB.Unscoped().Where("id = ? AND deleted_at IS NOT NULL", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Deleted user not found"})
		return
	}

	if err := database.DB.Unscoped().Model(&user).Update("deleted_at", nil).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restore user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User restored successfully"})
}
