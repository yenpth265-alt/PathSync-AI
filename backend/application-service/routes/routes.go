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
		api.PUT("/applications/:id", handlers.UpdateApplicationStatus)
		
		api.POST("/applications/:app_id/subtasks", handlers.AddSubtask)
		api.PUT("/subtasks/:id", handlers.ToggleSubtask)
	}
}
