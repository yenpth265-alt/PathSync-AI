package handlers

import (
	"context"
	"net/http"
	"strings"
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

	a := agent.NewAdmissionsCounselorAgent()
	response, err := a.Run(context.Background(), req.Messages, req.Profile)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(err.Error(), "conversation") || strings.Contains(err.Error(), "message") { status = http.StatusBadRequest }
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, response)
}

