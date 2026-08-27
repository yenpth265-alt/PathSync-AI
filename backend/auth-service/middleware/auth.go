package middleware

import (
	"net/http"
	"strings"

	"auth-service/utils"

	"github.com/gin-gonic/gin"
)

// RequireAuth verifies the Authorization: Bearer <token> header and stores
// the authenticated user's id/role in the request context. It aborts the
// request with 401 if the token is missing, malformed, or invalid.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		userID, ok := claims["user_id"].(string)
		if !ok || userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		role, _ := claims["role"].(string)

		c.Set("userID", userID)
		c.Set("role", role)
		c.Next()
	}
}

// RequireAdmin must run after RequireAuth. It rejects the request unless the
// authenticated user's role is "admin".
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			return
		}
		c.Next()
	}
}
