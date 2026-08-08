package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"

	"pathsync-ai-agent-service/llm"
)

const responseSchemaVersion = "2026-08"

// Agent is an orchestration boundary. It does not own admissions facts or
// persistent user state; it obtains facts through tools owned by domain services.
type Agent struct {
	Name         string
	SystemPrompt string
	Tools        map[string]Tool
	// LLM is nil when no provider is configured. converse checks it and
	// degrades rather than fabricating.
	LLM llm.Client
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
	ID                   string         `json:"id"`
	Type                 string         `json:"type"`
	Title                string         `json:"title"`
	Description          string         `json:"description"`
	Payload              map[string]any `json:"payload"`
	RequiresConfirmation bool           `json:"requires_confirmation"`
}

// Envelope is the module's safety contract. Every AI response embeds it.
type Envelope struct {
	SchemaVersion string     `json:"schema_version"`
	Citations     []Citation `json:"citations,omitempty"`
	SafetyNotice  string     `json:"safety_notice,omitempty"`
	Degraded      bool       `json:"degraded,omitempty"`
}

type AgentResponse struct {
	Envelope
	Reply           string           `json:"reply"`
	Nodes           []InsightNode    `json:"nodes"`
	Suggestions     []string         `json:"suggestions"`
	ProposedActions []ProposedAction `json:"proposed_actions"`
}

type Message struct {
	Role    string `json:"role" binding:"required,oneof=user assistant ai"`
	Content string `json:"content" binding:"required,max=6000"`
}

func NewAgent(name, systemPrompt string, tools []Tool, llmClient llm.Client) *Agent {
	toolMap := make(map[string]Tool, len(tools))
	for _, tool := range tools {
		toolMap[tool.Name] = tool
	}
	return &Agent{Name: name, SystemPrompt: systemPrompt, Tools: toolMap, LLM: llmClient}
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
		Envelope: Envelope{
			SchemaVersion: responseSchemaVersion,
			SafetyNotice:  "Gợi ý của AI hỗ trợ việc ra quyết định; hãy luôn kiểm tra yêu cầu cuối cùng trên trang chính thức của trường.",
		},
		Reply:       "Chào bạn, mình là PathSync Admissions Agent. Mình có thể cùng bạn xác định hướng học, tìm chương trình từ nguồn chính thức, và tạo lộ trình hồ sơ từng bước.",
		Suggestions: []string{"Tìm chương trình phù hợp với GPA của mình", "Lập lộ trình nộp hồ sơ", "Mình nên chuẩn bị gì cho bài luận?"},
	}
}

func (a *Agent) searchUniversities(ctx context.Context, query string, profile map[string]any) (AgentResponse, error) {
	tool, ok := a.Tools["search_universities"]
	if !ok {
		return AgentResponse{}, fmt.Errorf("university search tool is not configured")
	}
	result, err := tool.Execute(ctx, map[string]any{"query": query, "profile": profile})
	if err != nil {
		return AgentResponse{
			Envelope: Envelope{
				SchemaVersion: responseSchemaVersion,
				SafetyNotice:  "Không có dữ liệu được xác thực để trích dẫn trong phản hồi này.",
				Degraded:      true,
			},
			Reply: "Mình chưa kết nối được kho dữ liệu trường lúc này. Bạn hãy thử lại sau; mình sẽ không suy đoán dữ liệu tuyển sinh.",
		}, nil
	}

	programs := parsePrograms(result.Data)
	if len(programs) == 0 {
		return AgentResponse{
			Envelope: Envelope{
				SchemaVersion: responseSchemaVersion,
				SafetyNotice:  "Mình chỉ hiển thị kết quả có trong kho dữ liệu đã đồng bộ.",
			},
			Reply:       "Mình chưa tìm thấy chương trình phù hợp trong các nguồn đã đồng bộ. Bạn có thể cho mình thêm quốc gia, bậc học hoặc ngành mong muốn?",
			Suggestions: []string{"Cử nhân Khoa học máy tính ở Singapore", "Thạc sĩ Data Science với ngân sách 40,000 USD"},
		}, nil
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
	return AgentResponse{
		Envelope: Envelope{
			SchemaVersion: responseSchemaVersion,
			Citations:     UniqueCitations(citations),
			SafetyNotice:  "Học phí, yêu cầu và deadline có thể thay đổi. Hãy xác nhận lại tại nguồn chính thức trước khi nộp hồ sơ.",
		},
		Reply:           "Mình tìm thấy các lựa chọn dưới đây từ kho dữ liệu có nguồn:\n" + strings.Join(lines, "\n") + "\n\nBạn có thể mở nguồn để kiểm tra điều kiện và hạn nộp mới nhất.",
		ProposedActions: actions,
		Suggestions:     []string{"So sánh yêu cầu đầu vào", "Lập lộ trình chuẩn bị hồ sơ"},
	}, nil
}

func (a *Agent) generateRoadmap(ctx context.Context, query string, profile map[string]any) (AgentResponse, error) {
	tool, ok := a.Tools["generate_roadmap_tasks"]
	if !ok { return AgentResponse{}, fmt.Errorf("roadmap tool is not configured") }
	result, err := tool.Execute(ctx, map[string]any{"query": query, "profile": profile})
	if err != nil { return AgentResponse{}, err }
	roadmap := parseRoadmap(result.Data)

	// The tool's checklist is the same five generic milestones for every
	// question, so on its own this intent answered "how do I lift IELTS writing
	// by December" with a roadmap that never mentions IELTS. Ask the model to
	// rewrite the checklist around what was actually asked; the static version
	// stays as the fallback, flagged degraded.
	degraded := true
	if a.LLM != nil {
		if tailored, err := a.tailorRoadmap(ctx, query, profile, roadmap); err != nil {
			log.Printf("[roadmap] tailoring failed, using static checklist: %v", err)
		} else {
			roadmap, degraded = tailored, false
		}
	}

	notice := "Đây là checklist định hướng, không thay thế deadline chính thức của từng trường."
	if degraded {
		notice = "Checklist mặc định (chưa cá nhân hoá). " + notice
	}
	return AgentResponse{
		Envelope: Envelope{
			SchemaVersion: responseSchemaVersion,
			SafetyNotice:  notice,
			Degraded:      degraded,
		},
		Reply:       roadmap.Summary,
		Nodes:       roadmap.Nodes,
		ProposedActions: []ProposedAction{{
			ID: "create-roadmap", Type: "create_roadmap", Title: "Tạo checklist lộ trình",
			Description: "Thêm các mốc nháp vào bảng công việc của bạn.",
			Payload: map[string]any{"tasks": roadmap.Tasks}, RequiresConfirmation: true,
		}},
		Suggestions: []string{"Tìm trường phù hợp", "Rà soát hồ sơ hiện tại"},
	}, nil
}

// tailorRoadmap rewrites the generic checklist around the student's actual
// question. Task titles are the student's own todo items, so the model may write
// them; admissions facts are still off-limits, same as converse.
func (a *Agent) tailorRoadmap(ctx context.Context, query string, profile map[string]any, base roadmapData) (roadmapData, error) {
	profileJSON, _ := json.Marshal(profile)
	baseJSON, _ := json.Marshal(base.Tasks)
	prompt := fmt.Sprintf(`%s

Student question: %s
Student profile: %s
Default checklist (rewrite it, do not just repeat it): %s

Produce a preparation checklist that addresses this specific question. Reply in the language the student used.
Do not state university requirements, fees, deadlines, rankings, or scholarship facts — the student verifies those at official sources.
Return ONLY JSON, no markdown fence:
{"summary":"2-3 sentences naming what this student specifically needs to do next","tasks":[{"title":"concrete action","phase":"short phase name","priority":"high|medium|low"}]}
Between 4 and 7 tasks.`, a.SystemPrompt, query, profileJSON, baseJSON)

	resp, err := a.LLM.Generate(ctx, llm.Request{Capability: "roadmap", Prompt: prompt})
	if err != nil {
		return roadmapData{}, err
	}
	var out roadmapData
	if err := json.Unmarshal([]byte(cleanText(resp.Text)), &out); err != nil {
		return roadmapData{}, fmt.Errorf("parse roadmap JSON: %w", err)
	}
	if strings.TrimSpace(out.Summary) == "" || len(out.Tasks) == 0 {
		return roadmapData{}, fmt.Errorf("roadmap JSON missing summary or tasks")
	}
	out.Nodes = base.Nodes
	return out, nil
}

// converse uses the model only for non-factual coaching. When no model key is
// configured, the service still has a useful, explicit offline response.
func (a *Agent) converse(ctx context.Context, messages []Message, profile map[string]any) (AgentResponse, error) {
	if a.LLM == nil {
		return AgentResponse{
			Envelope: Envelope{
				SchemaVersion: responseSchemaVersion,
				SafetyNotice:  "Chế độ hướng dẫn cơ bản đang hoạt động vì nhà cung cấp AI chưa được cấu hình.",
				Degraded:      true,
			},
			Reply:       "Mình có thể giúp bạn làm rõ mục tiêu trước: bạn đang nhắm bậc học, quốc gia và kỳ nhập học nào? Khi cần dữ liệu trường, mình sẽ chỉ dùng nguồn đã được đồng bộ.",
			Suggestions: []string{"Mình muốn học ngành gì?", "Ngân sách của mình là bao nhiêu?", "Kỳ nhập học mình nhắm tới là khi nào?"},
		}, nil
	}

	profileJSON, _ := json.Marshal(profile)
	historyJSON, _ := json.Marshal(messages)
	prompt := fmt.Sprintf("%s\n\nStudent profile: %s\nConversation: %s\n\nReply in the user's language. Do not state admissions facts, rankings, fees, deadlines, or university requirements unless supplied by a verified tool. Return plain helpful coaching text only.", a.SystemPrompt, profileJSON, historyJSON)

	resp, err := a.LLM.Generate(ctx, llm.Request{
		Capability: "counsel",
		Prompt:     prompt,
	})
	if err != nil {
		return AgentResponse{}, err
	}

	return AgentResponse{
		Envelope: Envelope{
			SchemaVersion: responseSchemaVersion,
			SafetyNotice:  "Phản hồi này là hỗ trợ định hướng; dữ liệu tuyển sinh cần được kiểm tra từ nguồn chính thức.",
		},
		Reply:       cleanText(resp.Text),
		Suggestions: []string{"Tìm chương trình phù hợp", "Lập lộ trình hồ sơ"},
	}, nil
}

var markdownFence = regexp.MustCompile("(?s)^```[a-zA-Z]*\\s*(.*?)\\s*```$")
func cleanText(input string) string { if match := markdownFence.FindStringSubmatch(strings.TrimSpace(input)); len(match) == 2 { return strings.TrimSpace(match[1]) }; return strings.TrimSpace(input) }

