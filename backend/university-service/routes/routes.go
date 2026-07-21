package routes

import (
	"university-service/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1/universities")
	{
		api.GET("", handlers.GetUniversities)
	}
}
