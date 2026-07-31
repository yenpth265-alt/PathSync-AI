package routes

import (
	"github.com/gin-gonic/gin"
	"pathsync-ai-agent-service/handlers"
)

func RegisterRoutes(router *gin.RouterGroup) {
	agentGroup := router.Group("/agent")
	{
		agentGroup.POST("/counsel", handlers.AgentCounsel)
	}
}
