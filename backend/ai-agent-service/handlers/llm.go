package handlers

import (
	"log"

	"pathsync-ai-agent-service/llm"
)

// sharedLLM is built once at startup. It is nil when no provider credential is
// present, which every handler treats as a degradation signal rather than an
// error — see llm.ErrNotConfigured.
var sharedLLM llm.Client

// InitLLM is called from main before routes are served.
func InitLLM() {
	client, err := llm.New()
	if err != nil {
		if err == llm.ErrNotConfigured {
			log.Println("[AI] No LLM provider configured — AI responses will be served in degraded mode")
		} else {
			log.Printf("[AI] LLM provider init failed: %v — serving degraded mode", err)
		}
		return
	}
	sharedLLM = client
	log.Println("[AI] LLM provider ready")
}
