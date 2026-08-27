package routes

import (
	"application-service/handlers"
	"application-service/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")
	api.Use(middleware.RequireAuth())
	{
		api.GET("/applications", handlers.GetApplications)
		api.POST("/applications", handlers.CreateApplication)
		api.GET("/applications/metrics", handlers.GetMetrics)
		api.POST("/applications/review-essay", handlers.ReviewEssay)
		api.PUT("/applications/:id", handlers.UpdateApplicationStatus)
		api.PUT("/applications/:id/details", handlers.UpdateApplicationDetails)
		api.DELETE("/applications/:id", handlers.DeleteApplication)
		
		api.GET("/applications/:id/sop", handlers.GetApplicationSOP)
		api.PUT("/applications/:id/sop", handlers.UpdateApplicationSOP)
		api.PUT("/applications/:id/status", handlers.UpdateApplicationAppStatus)
		
		api.POST("/applications/:app_id/subtasks", handlers.AddSubtask)
		api.PUT("/subtasks/:id", handlers.ToggleSubtask)
	}
}
