package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"pathsync-ai-agent-service/agent"
	"pathsync-ai-agent-service/llm"
)

// --- SOP Assist ---

type SOPAssistInput struct {
	Prompt          string `json:"prompt"`
	ExistingContent string `json:"existing_content"`
	Action          string `json:"action"`
}

type SOPAssistResponse struct {
	agent.Envelope
	Suggestion   string                   `json:"suggestion"`
	Improvements []map[string]interface{} `json:"improvements"`
}

func SOPAssist(c *gin.Context) {
	var input SOPAssistInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if sharedLLM == nil {
		c.JSON(http.StatusOK, SOPAssistResponse{
			Envelope: agent.Envelope{
				SchemaVersion: "2026-08",
				SafetyNotice:  "Chức năng gợi ý chỉnh sửa đang tạm ngưng vì nhà cung cấp AI chưa được cấu hình.",
				Degraded:      true,
			},
			Suggestion: "Hãy tập trung vào việc mô tả chi tiết tác động của bài nghiên cứu hoặc hoạt động ngoại khóa thay vì dùng từ ngữ chung chung. Thêm số liệu định lượng hoặc ví dụ cụ thể để tăng sức thuyết phục.",
			Improvements: []map[string]interface{}{},
		})
		return
	}

	prompt := fmt.Sprintf(promptSOPAssist, input.Action, input.Prompt, input.ExistingContent)

	resp, err := sharedLLM.Generate(context.Background(), llm.Request{
		Capability: "sop",
		Prompt:     prompt,
	})
	if err != nil {
		log.Printf("[SOPAssist] LLM call failed: %v", err)
		c.JSON(http.StatusOK, SOPAssistResponse{
			Envelope: agent.Envelope{
				SchemaVersion: "2026-08",
				SafetyNotice:  "Gợi ý chung được trả về do lỗi tạm thời.",
				Degraded:      true,
			},
			Suggestion:   "Hãy làm rõ những trải nghiệm cụ thể, vai trò và kết quả đo được của bạn. Tránh những cụm từ chung chung.",
			Improvements: []map[string]interface{}{},
		})
		return
	}

	var result SOPAssistResponse
	if err := json.Unmarshal([]byte(resp.Text), &result); err != nil {
		log.Printf("[SOPAssist] Failed to parse JSON: %v", err)
		c.JSON(http.StatusOK, SOPAssistResponse{
			Envelope: agent.Envelope{
				SchemaVersion: "2026-08",
				SafetyNotice:  "Phản hồi định dạng tự do do lỗi phân tích.",
				Degraded:      true,
			},
			Suggestion:   resp.Text,
			Improvements: []map[string]interface{}{},
		})
		return
	}

	result.Envelope = agent.Envelope{
		SchemaVersion: "2026-08",
		SafetyNotice:  "Gợi ý của AI hỗ trợ tự chỉnh sửa; AI không viết lại toàn bộ bài cho bạn.",
	}
	c.JSON(http.StatusOK, result)
}

// --- Smart Match ---

type SmartMatchInput struct {
	GPA             float64  `json:"gpa"`
	IELTS           float64  `json:"ielts"`
	TOEFL           int      `json:"toefl"`
	WorkExp         int      `json:"work_exp"`
	Fields          []string `json:"fields"`
	TargetCountries []string `json:"target_countries"`
	Budget          int      `json:"budget"`
}

type SmartMatchResponse struct {
	agent.Envelope
	Reach  []map[string]interface{} `json:"reach"`
	Target []map[string]interface{} `json:"target"`
	Safe   []map[string]interface{} `json:"safe"`
}

func SmartMatch(c *gin.Context) {
	var input SmartMatchInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch real programs via the shared tool
	tool := agent.SearchUniversitiesTool()
	result, err := tool.Execute(context.Background(), map[string]any{
		"query":   strings.Join(input.Fields, " "),
		"profile": map[string]any{"gpa": input.GPA, "budget": input.Budget},
	})

	var programs []agent.UniversityProgram
	if err == nil {
		programs, _ = result.Data.([]agent.UniversityProgram)
	}

	if len(programs) == 0 || sharedLLM == nil {
		fallbackMatch(c, input, programs)
		return
	}

	var summary []string
	for _, p := range programs {
		summary = append(summary, fmt.Sprintf("- Uni: %s | Program: %s | MinGPA: %.1f | MinIELTS: %.1f | Tuition: $%.0f",
			p.UniversityName, p.Name, p.MinGPA, p.MinIELTS, p.TuitionPerYear))
	}

	prompt := fmt.Sprintf(promptSmartMatch, input.GPA, input.IELTS, input.TOEFL, input.WorkExp,
		strings.Join(input.Fields, ", "), strings.Join(input.TargetCountries, ", "),
		input.Budget, strings.Join(summary, "\n"))

	resp, err := sharedLLM.Generate(context.Background(), llm.Request{
		Capability: "match",
		Prompt:     prompt,
	})
	if err != nil {
		log.Printf("[SmartMatch] LLM call failed: %v", err)
		fallbackMatch(c, input, programs)
		return
	}

	var llmResult SmartMatchResponse
	if err := json.Unmarshal([]byte(resp.Text), &llmResult); err != nil {
		log.Printf("[SmartMatch] Failed to parse JSON: %v", err)
		fallbackMatch(c, input, programs)
		return
	}

	citations := make([]agent.Citation, 0, len(programs))
	for _, p := range programs {
		if p.SourceURL != "" {
			label := p.SourceLabel
			if label == "" {
				label = p.UniversityName + " — nguồn chính thức"
			}
			citations = append(citations, agent.Citation{
				Label:          label,
				URL:            p.SourceURL,
				LastVerifiedAt: p.LastVerifiedAt,
			})
		}
	}

	llmResult.Envelope = agent.Envelope{
		SchemaVersion: "2026-08",
		Citations:     agent.UniqueCitations(citations),
		SafetyNotice:  "Kết quả được xếp hạng bởi AI dựa trên dữ liệu có nguồn. Hãy xác nhận yêu cầu cuối cùng tại nguồn chính thức.",
	}
	c.JSON(http.StatusOK, llmResult)
}

func fallbackMatch(c *gin.Context, input SmartMatchInput, programs []agent.UniversityProgram) {
	reach := []map[string]interface{}{}
	target := []map[string]interface{}{}
	safe := []map[string]interface{}{}

	userScore := int(math.Min(100, (input.GPA/4.0)*60+(input.IELTS/9.0)*20+float64(input.WorkExp)*5))

	for _, p := range programs {
		item := map[string]interface{}{
			"university": p.UniversityName,
			"program":    p.Name,
			"score":      userScore,
			"reasons":    []string{fmt.Sprintf("Yêu cầu GPA tối thiểu %.1f (GPA của bạn: %.1f)", p.MinGPA, input.GPA)},
		}

		if input.GPA >= p.MinGPA+0.3 {
			safe = append(safe, item)
		} else if input.GPA >= p.MinGPA {
			target = append(target, item)
		} else {
			reach = append(reach, item)
		}
	}

	c.JSON(http.StatusOK, SmartMatchResponse{
		Envelope: agent.Envelope{
			SchemaVersion: "2026-08",
			SafetyNotice:  "Kết quả thuật toán dự phòng. Dữ liệu từ nguồn chính thức nhưng thuật toán chưa qua đào tạo.",
			Degraded:      true,
		},
		Reach:  reach,
		Target: target,
		Safe:   safe,
	})
}

// --- Essay Review ---

type EssayReviewInput struct {
	Content string `json:"content"`
	Prompt  string `json:"prompt"`
}

type RubricScore struct {
	Dimension    string `json:"dimension"`
	Level        string `json:"level"`
	EvidenceSpan string `json:"evidence_span"`
	Advice       string `json:"advice"`
}

type EssayReviewResponse struct {
	agent.Envelope
	Score     int                        `json:"score"`
	Rubric    []RubricScore              `json:"rubric,omitempty"`
	Feedback  string                     `json:"feedback"`
	Issues    []map[string]interface{}   `json:"issues"`
	Strengths []string                   `json:"strengths"`
}

func EssayReview(c *gin.Context) {
	var input EssayReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if sharedLLM == nil {
		c.JSON(http.StatusOK, EssayReviewResponse{
			Envelope: agent.Envelope{
				SchemaVersion: "2026-08",
				SafetyNotice:  "Chức năng chấm bài không khả dụng vì nhà cung cấp AI chưa được cấu hình.",
				Degraded:      true,
			},
			Score:     0,
			Feedback:  "Dịch vụ đánh giá AI hiện đang tạm ngừng. Hãy liên hệ mentor để được phản hồi.",
			Issues:    []map[string]interface{}{},
			Strengths: []string{},
		})
		return
	}

	prompt := fmt.Sprintf(promptEssayReview, input.Prompt, input.Content)

	resp, err := sharedLLM.Generate(context.Background(), llm.Request{
		Capability: "essay",
		Prompt:     prompt,
	})
	if err != nil {
		log.Printf("[EssayReview] LLM call failed: %v", err)
		c.JSON(http.StatusOK, EssayReviewResponse{
			Envelope: agent.Envelope{
				SchemaVersion: "2026-08",
				SafetyNotice:  "Lỗi kết nối tạm thời. Hãy thử lại hoặc liên hệ mentor.",
				Degraded:      true,
			},
			Score:     0,
			Feedback:  "Dịch vụ AI gặp lỗi tạm thời. Hãy thử lại sau vài phút.",
			Issues:    []map[string]interface{}{},
			Strengths: []string{},
		})
		return
	}

	var result EssayReviewResponse
	if err := json.Unmarshal([]byte(resp.Text), &result); err != nil {
		log.Printf("[EssayReview] Failed to parse JSON: %v", err)
		c.JSON(http.StatusOK, EssayReviewResponse{
			Envelope: agent.Envelope{
				SchemaVersion: "2026-08",
				SafetyNotice:  "Phản hồi định dạng tự do do lỗi phân tích.",
				Degraded:      true,
			},
			Score:     0,
			Feedback:  resp.Text,
			Issues:    []map[string]interface{}{},
			Strengths: []string{},
		})
		return
	}

	result.Envelope = agent.Envelope{
		SchemaVersion: "2026-08",
		SafetyNotice:  "Nhận xét của AI hỗ trợ bạn tự sửa bài; AI không viết lại bài luận cho bạn.",
	}
	c.JSON(http.StatusOK, result)
}
