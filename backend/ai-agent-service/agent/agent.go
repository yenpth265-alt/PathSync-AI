package agent

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

const responseSchemaVersion = "2026-07"

// Agent is an orchestration boundary. It does not own admissions facts or
// persistent user state; it obtains facts through tools owned by domain services.
type Agent struct {
	Name         string
	SystemPrompt string
	Tools        map[string]Tool
	HTTPClient   *http.Client
}

type Citation struct {
	Label          string `json:"label"`
	URL            string `json:"url"`
	LastVerifiedAt string `json:"last_verified_at,omitempty"`
}

type InsightNode struct {
	ID          string `json:"id"`
	Label       string `json:"label"`
	Category    string `json:"category"`
	Description string `json:"description"`
}

// ProposedAction is deliberately non-mutating. The client must show it and ask
// for confirmation before calling the owning domain service.
type ProposedAction struct {
	ID          string         `json:"id"`
	Type        string         `json:"type"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Payload     map[string]any `json:"payload"`
	RequiresConfirmation bool `json:"requires_confirmation"`
}

type AgentResponse struct {
	SchemaVersion  string           `json:"schema_version"`
	Reply          string           `json:"reply"`
	Nodes          []InsightNode    `json:"nodes"`
	Suggestions    []string         `json:"suggestions"`
	Citations      []Citation       `json:"citations"`
	ProposedActions []ProposedAction `json:"proposed_actions"`
	SafetyNotice   string           `json:"safety_notice,omitempty"`
}

type Message struct {
	Role    string `json:"role" binding:"required,oneof=user assistant ai"`
	Content string `json:"content" binding:"required,max=6000"`
}

func NewAgent(name, systemPrompt string, tools []Tool) *Agent {
	toolMap := make(map[string]Tool, len(tools))
	for _, tool := range tools {
		toolMap[tool.Name] = tool
	}
	return &Agent{Name: name, SystemPrompt: systemPrompt, Tools: toolMap, HTTPClient: &http.Client{Timeout: 20 * time.Second}}
}

func (a *Agent) Run(ctx context.Context, messages []Message, profile map[string]any) (AgentResponse, error) {
	if err := validateConversation(messages); err != nil {
		return AgentResponse{}, err
	}

	latest := latestUserMessage(messages)
	if latest == "" {
		return a.welcomeResponse(), nil
	}

	intent := detectIntent(latest)
	switch intent {
	case "university_search":
		return a.searchUniversities(ctx, latest, profile)
	case "roadmap":
		return a.generateRoadmap(ctx, latest, profile)
	default:
		return a.converse(ctx, messages, profile)
	}
}

func validateConversation(messages []Message) error {
	if len(messages) > 30 {
		return fmt.Errorf("conversation is limited to 30 messages")
	}
	for _, message := range messages {
		if strings.TrimSpace(message.Content) == "" {
			return fmt.Errorf("message content cannot be empty")
		}
	}
	return nil
}

func latestUserMessage(messages []Message) string {
	for i := len(messages) - 1; i >= 0; i-- {
		if messages[i].Role == "user" {
			return strings.TrimSpace(messages[i].Content)
		}
	}
	return ""
}

func detectIntent(input string) string {
	lower := strings.ToLower(input)
	if containsAny(lower, "trường", "university", "program", "ngành", "học phí", "tuition", "scholarship", "học bổng", "admission") {
		return "university_search"
	}
	if containsAny(lower, "lộ trình", "roadmap", "kế hoạch", "deadline", "khi nào", "timeline") {
		return "roadmap"
	}
	return "conversation"
}

func containsAny(input string, words ...string) bool {
	for _, word := range words {
		if strings.Contains(input, word) {
			return true
		}
	}
	return false
}

func (a *Agent) welcomeResponse() AgentResponse {
	return AgentResponse{
		SchemaVersion: responseSchemaVersion,
		Reply: "Chào bạn, mình là PathSync Admissions Agent. Mình có thể cùng bạn xác định hướng học, tìm chương trình từ nguồn chính thức, và tạo lộ trình hồ sơ từng bước.",
		Suggestions: []string{"Tìm chương trình phù hợp với GPA của mình", "Lập lộ trình nộp hồ sơ", "Mình nên chuẩn bị gì cho bài luận?"},
		SafetyNotice: "Gợi ý của AI hỗ trợ việc ra quyết định; hãy luôn kiểm tra yêu cầu cuối cùng trên trang chính thức của trường.",
	}
}

func (a *Agent) searchUniversities(ctx context.Context, query string, profile map[string]any) (AgentResponse, error) {
	tool, ok := a.Tools["search_universities"]
	if !ok {
		return AgentResponse{}, fmt.Errorf("university search tool is not configured")
	}
	result, err := tool.Execute(ctx, map[string]any{"query": query, "profile": profile})
	if err != nil {
		return AgentResponse{SchemaVersion: responseSchemaVersion, Reply: "Mình chưa kết nối được kho dữ liệu trường lúc này. Bạn hãy thử lại sau; mình sẽ không suy đoán dữ liệu tuyển sinh.", SafetyNotice: "Không có dữ liệu được xác thực để trích dẫn trong phản hồi này."}, nil
	}

	programs := parsePrograms(result.Data)
	if len(programs) == 0 {
		return AgentResponse{SchemaVersion: responseSchemaVersion, Reply: "Mình chưa tìm thấy chương trình phù hợp trong các nguồn đã đồng bộ. Bạn có thể cho mình thêm quốc gia, bậc học hoặc ngành mong muốn?", Suggestions: []string{"Cử nhân Khoa học máy tính ở Singapore", "Thạc sĩ Data Science với ngân sách 40,000 USD"}, SafetyNotice: "Mình chỉ hiển thị kết quả có trong kho dữ liệu đã đồng bộ."}, nil
	}

	lines := make([]string, 0, len(programs))
	citations := make([]Citation, 0, len(programs))
	actions := make([]ProposedAction, 0, len(programs))
	for _, program := range programs {
		line := fmt.Sprintf("• %s — %s", program.UniversityName, program.Name)
		if program.Degree != "" { line += " (" + program.Degree + ")" }
		if program.TuitionPerYear > 0 { line += fmt.Sprintf(", học phí công bố: %.0f/năm", program.TuitionPerYear) }
		lines = append(lines, line)
		if program.SourceURL != "" { citations = append(citations, Citation{Label: sourceLabel(program), URL: program.SourceURL, LastVerifiedAt: program.LastVerifiedAt}) }
		actions = append(actions, ProposedAction{ID: "save-program-" + program.ID, Type: "save_program", Title: "Thêm vào danh sách theo dõi", Description: "Tạo nháp hồ sơ ứng tuyển cho " + program.UniversityName + ".", Payload: map[string]any{"university_id": program.UniversityID, "university_name": program.UniversityName, "program_id": program.ID, "program_name": program.Name, "deadline": program.Deadline}, RequiresConfirmation: true})
	}
	return AgentResponse{SchemaVersion: responseSchemaVersion, Reply: "Mình tìm thấy các lựa chọn dưới đây từ kho dữ liệu có nguồn:\n" + strings.Join(lines, "\n") + "\n\nBạn có thể mở nguồn để kiểm tra điều kiện và hạn nộp mới nhất.", Citations: uniqueCitations(citations), ProposedActions: actions, Suggestions: []string{"So sánh yêu cầu đầu vào", "Lập lộ trình chuẩn bị hồ sơ"}, SafetyNotice: "Học phí, yêu cầu và deadline có thể thay đổi. Hãy xác nhận lại tại nguồn chính thức trước khi nộp hồ sơ."}, nil
}

func (a *Agent) generateRoadmap(ctx context.Context, query string, profile map[string]any) (AgentResponse, error) {
	tool, ok := a.Tools["generate_roadmap_tasks"]
	if !ok { return AgentResponse{}, fmt.Errorf("roadmap tool is not configured") }
	result, err := tool.Execute(ctx, map[string]any{"query": query, "profile": profile})
	if err != nil { return AgentResponse{}, err }
	roadmap := parseRoadmap(result.Data)
	return AgentResponse{SchemaVersion: responseSchemaVersion, Reply: "Đây là lộ trình nháp để bạn bắt đầu:\n" + roadmap.Summary, Nodes: roadmap.Nodes, ProposedActions: []ProposedAction{{ID: "create-roadmap", Type: "create_roadmap", Title: "Tạo checklist lộ trình", Description: "Thêm các mốc nháp vào bảng công việc của bạn.", Payload: map[string]any{"tasks": roadmap.Tasks}, RequiresConfirmation: true}}, Suggestions: []string{"Tìm trường phù hợp", "Rà soát hồ sơ hiện tại"}, SafetyNotice: "Đây là checklist định hướng, không thay thế deadline chính thức của từng trường."}, nil
}

// converse uses the model only for non-factual coaching. When no model key is
// configured, the service still has a useful, explicit offline response.
func (a *Agent) converse(ctx context.Context, messages []Message, profile map[string]any) (AgentResponse, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return AgentResponse{SchemaVersion: responseSchemaVersion, Reply: "Mình có thể giúp bạn làm rõ mục tiêu trước: bạn đang nhắm bậc học, quốc gia và kỳ nhập học nào? Khi cần dữ liệu trường, mình sẽ chỉ dùng nguồn đã được đồng bộ.", Suggestions: []string{"Mình muốn học ngành gì?", "Ngân sách của mình là bao nhiêu?", "Kỳ nhập học mình nhắm tới là khi nào?"}, SafetyNotice: "Chế độ hướng dẫn cơ bản đang hoạt động vì nhà cung cấp AI chưa được cấu hình."}, nil
	}
	return a.callGemini(ctx, apiKey, messages, profile)
}

type geminiRequest struct { Contents []geminiContent `json:"contents"` }
type geminiContent struct { Parts []geminiPart `json:"parts"` }
type geminiPart struct { Text string `json:"text"` }
type geminiResponse struct { Candidates []struct { Content struct { Parts []geminiPart `json:"parts"` } `json:"content"` } `json:"candidates"` }

func (a *Agent) callGemini(ctx context.Context, apiKey string, messages []Message, profile map[string]any) (AgentResponse, error) {
	profileJSON, _ := json.Marshal(profile)
	historyJSON, _ := json.Marshal(messages)
	prompt := fmt.Sprintf("%s\n\nStudent profile: %s\nConversation: %s\n\nReply in the user's language. Do not state admissions facts, rankings, fees, deadlines, or university requirements unless supplied by a verified tool. Return plain helpful coaching text only.", a.SystemPrompt, profileJSON, historyJSON)
	body, _ := json.Marshal(geminiRequest{Contents: []geminiContent{{Parts: []geminiPart{{Text: prompt}}}}})
	model := os.Getenv("GEMINI_MODEL")
	if model == "" { model = "gemini-1.5-flash" }
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey), bytes.NewReader(body))
	if err != nil { return AgentResponse{}, err }
	req.Header.Set("Content-Type", "application/json")
	resp, err := a.HTTPClient.Do(req)
	if err != nil { return AgentResponse{}, err }
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK { body, _ := io.ReadAll(resp.Body); return AgentResponse{}, fmt.Errorf("Gemini API error: %s", string(body)) }
	var decoded geminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil || len(decoded.Candidates) == 0 || len(decoded.Candidates[0].Content.Parts) == 0 { return AgentResponse{}, fmt.Errorf("invalid Gemini response") }
	return AgentResponse{SchemaVersion: responseSchemaVersion, Reply: cleanText(decoded.Candidates[0].Content.Parts[0].Text), Suggestions: []string{"Tìm chương trình phù hợp", "Lập lộ trình hồ sơ"}, SafetyNotice: "Phản hồi này là hỗ trợ định hướng; dữ liệu tuyển sinh cần được kiểm tra từ nguồn chính thức."}, nil
}

var markdownFence = regexp.MustCompile("(?s)^```(?:text)?\\s*(.*?)\\s*```$")
func cleanText(input string) string { if match := markdownFence.FindStringSubmatch(strings.TrimSpace(input)); len(match) == 2 { return strings.TrimSpace(match[1]) }; return strings.TrimSpace(input) }

