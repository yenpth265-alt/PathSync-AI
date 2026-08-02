package routes

import (
	"auth-service/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/send-otp", handlers.SendOTP)
		auth.POST("/verify-otp", handlers.VerifyOTP)
		auth.POST("/login", handlers.Login)
	}

	admin := r.Group("/api/v1/admin")
	{
		admin.GET("/users", handlers.GetAdminUsers)
		admin.PUT("/users/:id/role", handlers.UpdateUserRole)
		admin.PUT("/users/:id/status", handlers.UpdateUserStatus)
		admin.DELETE("/users/:id", handlers.DeleteUser)
	}
	
	profile := r.Group("/api/v1/profile")
	{
		profile.GET("", handlers.GetMyProfile)
		profile.PUT("", handlers.UpdateMyProfile)
		profile.GET("/completion", handlers.GetProfileCompletion)
	}
}
