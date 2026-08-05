package routes

import (
	"github.com/gin-gonic/gin"
	"pathsync-ai-agent-service/handlers"
)

func RegisterRoutes(router *gin.RouterGroup) {
	agentGroup := router.Group("/agent")
	{
		agentGroup.POST("/counsel", handlers.AgentCounsel)
		agentGroup.POST("/swarm", handlers.AgentSwarm)
		agentGroup.GET("/swarm/sessions", handlers.GetSwarmHistory)
		agentGroup.GET("/swarm/sessions/:id", handlers.GetSwarmSessionDetail)
	}
}
