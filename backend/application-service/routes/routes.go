package routes

import (
	"application-service/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")
	{
		api.GET("/applications", handlers.GetApplications)
		api.POST("/applications", handlers.CreateApplication)
		api.GET("/applications/metrics", handlers.GetMetrics)
		api.POST("/applications/review-essay", handlers.ReviewEssay)
		api.PUT("/applications/:id", handlers.UpdateApplicationStatus)
		api.PUT("/applications/:id/details", handlers.UpdateApplicationDetails)
		api.DELETE("/applications/:id", handlers.DeleteApplication)
		
		api.POST("/applications/:app_id/subtasks", handlers.AddSubtask)
		api.PUT("/subtasks/:id", handlers.ToggleSubtask)
	}
}
