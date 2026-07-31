package routes

import (
	"auth-service/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}
	
	profile := r.Group("/api/v1/profile")
	{
		profile.GET("", handlers.GetMyProfile)
		profile.PUT("", handlers.UpdateMyProfile)
		profile.GET("/completion", handlers.GetProfileCompletion)
	}
}
