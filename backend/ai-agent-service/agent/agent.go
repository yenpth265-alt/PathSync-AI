package agent

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
)

type Agent struct {
	Name         string
	SystemPrompt string
	Tools        map[string]Tool
}

func NewAgent(name string, systemPrompt string, tools []Tool) *Agent {
	toolMap := make(map[string]Tool)
	for _, t := range tools {
		toolMap[t.Name] = t
	}
	return &Agent{
		Name:         name,
		SystemPrompt: systemPrompt,
		Tools:        toolMap,
	}
}

type GeminiReq struct {
	Contents []GeminiContent `json:"contents"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiResp struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func cleanMarkdownJSON(input string) string {
	cleaned := strings.TrimSpace(input)
	re := regexp.MustCompile("(?s)^```(?:json)?\\s*(.*?)\\s*```$")
	matches := re.FindStringSubmatch(cleaned)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	return cleaned
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// RunReActLoop executes a ReAct (Reasoning + Acting) loop with Gemini
func (a *Agent) RunReActLoop(messages []Message, profile map[string]any) (string, []map[string]any, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		apiKey = "DUMMY_KEY_FOR_TESTING"
	}

	var toolsDesc strings.Builder
	for name, t := range a.Tools {
		toolsDesc.WriteString(fmt.Sprintf("- %s: %s\n", name, t.Description))
	}

	var historyBuilder strings.Builder
	for _, m := range messages {
		historyBuilder.WriteString(fmt.Sprintf("%s: %s\n", m.Role, m.Content))
	}

	// Dump profile if exists
	profileJson, _ := json.Marshal(profile)

	prompt := fmt.Sprintf(`System: %s

Available Tools:
%s

Student Profile Context: %s

Conversation History:
%s

Instructions for ReAct Loop:
If you need to query database or fetch tools to answer the user goal, output JSON with "action": "tool_name", "action_input": { ... }.
If you have sufficient information to answer the user, output JSON with "action": "final_answer", "response": "Your full response string", "nodes": [{"id":"..", "label":"..", "category":"..", "description":".."}]. 
The "nodes" array is used to extract achievements or bright spots from the conversation.

Return ONLY valid JSON matching:
{
  "action": "tool_name_or_final_answer",
  "action_input": {},
  "response": "Final answer if action is final_answer",
  "nodes": []
}`, a.SystemPrompt, toolsDesc.String(), string(profileJson), historyBuilder.String())

	reqBody := GeminiReq{
		Contents: []GeminiContent{
			{Parts: []GeminiPart{{Text: prompt}}},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", nil, err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", apiKey)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", nil, fmt.Errorf("Gemini Agent API error: %s", string(bodyBytes))
	}

	var gResp GeminiResp
	if err := json.NewDecoder(resp.Body).Decode(&gResp); err != nil || len(gResp.Candidates) == 0 {
		return "", nil, fmt.Errorf("invalid response from Gemini Agent")
	}

	rawOutput := cleanMarkdownJSON(gResp.Candidates[0].Content.Parts[0].Text)

	var decision struct {
		Action      string                 `json:"action"`
		ActionInput map[string]interface{} `json:"action_input"`
		Response    string                 `json:"response"`
		Nodes       []map[string]any       `json:"nodes"`
	}

	if err := json.Unmarshal([]byte(rawOutput), &decision); err != nil {
		// If raw output isn't JSON, return as direct text
		return rawOutput, nil, nil
	}

	// ReAct Loop: Execute tool if requested
	if decision.Action != "final_answer" {
		if tool, exists := a.Tools[decision.Action]; exists {
			log.Printf("[Agent %s] Executing Tool: %s\n", a.Name, decision.Action)
			toolOutput, err := tool.Execute(decision.ActionInput)
			if err != nil {
				toolOutput = fmt.Sprintf("Tool error: %v", err)
			}

			// Pass tool output back to Gemini for final synthesis
			secondPrompt := fmt.Sprintf("%s\n\nTool '%s' returned:\n%s\n\nNow synthesize a complete final answer for the user.", prompt, decision.Action, toolOutput)
			return a.callFinalSynthesis(secondPrompt, apiKey)
		}
	}

	return decision.Response, decision.Nodes, nil
}

func (a *Agent) callFinalSynthesis(prompt string, apiKey string) (string, []map[string]any, error) {
	reqBody := GeminiReq{
		Contents: []GeminiContent{
			{Parts: []GeminiPart{{Text: prompt}}},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", nil, err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", apiKey)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", nil, fmt.Errorf("Gemini synthesis error")
	}

	var gResp GeminiResp
	if err := json.NewDecoder(resp.Body).Decode(&gResp); err != nil || len(gResp.Candidates) == 0 {
		return "", nil, fmt.Errorf("invalid response from Gemini synthesis")
	}

	rawOutput := cleanMarkdownJSON(gResp.Candidates[0].Content.Parts[0].Text)

	var decision struct {
		Action   string           `json:"action"`
		Response string           `json:"response"`
		Nodes    []map[string]any `json:"nodes"`
	}

	if err := json.Unmarshal([]byte(rawOutput), &decision); err != nil {
		return rawOutput, nil, nil
	}

	return decision.Response, decision.Nodes, nil
}
