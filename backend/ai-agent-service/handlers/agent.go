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

type SwarmRequest struct {
	Query   string         `json:"query"`
	Profile map[string]any `json:"profile"`
}

func AgentSwarm(c *gin.Context) {
	var req SwarmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Query = "Đánh giá hồ sơ du học và lộ trình nộp đơn"
	}

	a := agent.NewAdmissionsCounselorAgent()
	orchestrator := agent.NewSwarmOrchestrator(a)
	resp, err := orchestrator.RunSwarmPipeline(c.Request.Context(), req.Query, req.Profile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

