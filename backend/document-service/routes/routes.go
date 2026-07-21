package routes

import (
	"document-service/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1/documents")
	{
		api.GET("", handlers.GetDocuments)
		api.POST("", handlers.CreateDocument)
		api.PUT("/:id", handlers.UpdateDocument)
		api.DELETE("/:id", handlers.DeleteDocument)
	}
}
