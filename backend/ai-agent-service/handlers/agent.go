package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	
	"pathsync-ai-agent-service/agent"
)

type AgentCounselRequest struct {
	SessionID string            `json:"session_id"`
	Messages  []agent.Message   `json:"messages"`
	Profile   map[string]any    `json:"profile"`
}

func AgentCounsel(c *gin.Context) {
	var req AgentCounselRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Initialize the Agent
	a := agent.NewAdmissionsCounselorAgent()

	// Run ReAct Loop
	finalAnswer, nodes, err := a.RunReActLoop(req.Messages, req.Profile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reply": finalAnswer,
		"nodes": nodes,
	})
}

