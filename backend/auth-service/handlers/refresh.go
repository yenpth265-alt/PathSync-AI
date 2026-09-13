package handlers

import (
	"net/http"
	"time"

	"auth-service/database"
	"auth-service/models"
	"auth-service/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// issueTokenPair is the one place a session actually starts — Login and
// VerifyOTP both call this instead of utils.GenerateToken directly, so every
// login path gets a refresh token the same way.
func issueTokenPair(user models.User) (accessToken string, refreshToken string, err error) {
	accessToken, err = utils.GenerateToken(user.ID, user.Email, user.FullName, user.Role)
	if err != nil {
		return "", "", err
	}

	refreshToken, tokenHash, err := utils.NewRefreshToken()
	if err != nil {
		return "", "", err
	}

	record := models.RefreshToken{
		ID:        uuid.NewString(),
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(utils.RefreshTokenTTL),
	}
	if err := database.DB.Create(&record).Error; err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

type RefreshInput struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// RefreshAccessToken rotates a refresh token: the presented one is revoked
// and a brand-new (access, refresh) pair is issued, whether or not the old
// access token has expired yet. A refresh token can only ever be redeemed
// once — presenting an already-revoked one (a sign it may have been stolen
// and already used by someone else) is refused outright rather than quietly
// handed a new token pair anyway.
func RefreshAccessToken(c *gin.Context) {
	var input RefreshInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tokenHash := utils.HashRefreshToken(input.RefreshToken)

	var record models.RefreshToken
	if err := database.DB.Where("token_hash = ?", tokenHash).First(&record).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}
	if record.Revoked {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "This refresh token has already been used. Please log in again."})
		return
	}
	if time.Now().After(record.ExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token expired. Please log in again."})
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", record.UserID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account no longer exists"})
		return
	}
	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Your account has been disabled by admin"})
		return
	}

	database.DB.Model(&record).Update("revoked", true)

	accessToken, refreshToken, err := issueTokenPair(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to issue new tokens"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":         accessToken,
		"refresh_token": refreshToken,
	})
}
