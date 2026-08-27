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

	// Fetch real programs via the shared tool. One query per canonical field:
	// the search is a substring match, so joining several fields into a single
	// string ("Computer Science Data Science") matches nothing.
	tool := agent.SearchUniversitiesTool()
	queries := resolveFieldSearchTerms(input.Fields)
	if len(queries) == 0 {
		queries = []string{""} // no field given — let the service return everything
	}

	var programs []agent.UniversityProgram
	seenProgram := make(map[string]bool)
	skipped := 0
	for _, query := range queries {
		result, err := tool.Execute(context.Background(), map[string]any{
			"query":   query,
			"profile": map[string]any{"gpa": input.GPA, "budget": input.Budget},
		})
		if err != nil {
			log.Printf("[SmartMatch] program lookup failed for %q: %v", query, err)
			continue
		}
		found, _ := result.Data.([]agent.UniversityProgram)
		for _, p := range found {
			if seenProgram[p.ID] {
				continue
			}
			seenProgram[p.ID] = true

			// Filter by TargetCountries if specified
			if len(input.TargetCountries) > 0 {
				matchedCountry := false
				programCountry := strings.TrimSpace(p.University.Country)
				if programCountry == "" {
					// Unknown country — let it through rather than filtering
					matchedCountry = true
				} else {
					for _, c := range input.TargetCountries {
						canonical := normalizeCountryName(c)
						if strings.EqualFold(canonical, programCountry) {
							matchedCountry = true
							break
						}
						// "Europe" matches any European country
						if strings.EqualFold(canonical, "Europe") && isEuropeanCountry(programCountry) {
							matchedCountry = true
							break
						}
					}
				}
				if !matchedCountry {
					continue
				}
			}
			// Crawler-discovered rows carry a program name and nothing else —
			// no GPA bar, no tuition. There is nothing to match a profile
			// against, so ranking them produced a wall of identical "Safe,
			// 95%" entries for the same university, and rated a 2.6 GPA safe
			// for MIT. Matching needs published requirements.
			if p.MinGPA <= 0 {
				skipped++
				continue
			}
			programs = append(programs, p)
		}
	}
	if skipped > 0 {
		log.Printf("[SmartMatch] skipped %d program(s) with no published admissions requirements", skipped)
	}

	if len(programs) == 0 || sharedLLM == nil {
		fallbackMatch(c, input, programs)
		return
	}

	// Cap the prompt. An unfiltered search returns every program the crawler has
	// ever seen; at that size the model returned three empty buckets, which the
	// UI rendered as a blank page.
	const maxPrograms = 25
	if len(programs) > maxPrograms {
		log.Printf("[SmartMatch] %d programs matched, ranking the first %d", len(programs), maxPrograms)
		programs = programs[:maxPrograms]
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

	// Valid JSON with nothing in it is still a blank page. We had programs to
	// rank, so rank them ourselves rather than report success with no results.
	if len(llmResult.Reach)+len(llmResult.Target)+len(llmResult.Safe) == 0 {
		log.Printf("[SmartMatch] LLM returned no ranked programs for %d candidates; using fallback", len(programs))
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
	}
	c.JSON(http.StatusOK, result)
}

// CleanJSONResponse removes ```json ... ``` markdown block wrappers if present
func CleanJSONResponse(input string) string {
	cleaned := strings.TrimSpace(input)
	if strings.HasPrefix(cleaned, "```") {
		lines := strings.Split(cleaned, "\n")
		if len(lines) >= 2 {
			if strings.HasPrefix(strings.TrimSpace(lines[0]), "```") {
				lines = lines[1:]
			}
			if strings.HasPrefix(strings.TrimSpace(lines[len(lines)-1]), "```") {
				lines = lines[:len(lines)-1]
			}
			return strings.Join(lines, "\n")
		}
	}
	return cleaned
}

type InterviewSimInput struct {
	History []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"history"`
	UserMessage string `json:"user_message"`
}

func InterviewSim(c *gin.Context) {
	var input InterviewSimInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prompt := fmt.Sprintf(`You are an AI Admissions Interviewer conducting a mock interview.
User response: %s

Provide:
1. The next insightful follow-up question. IMPORTANT: The question MUST be in the EXACT SAME language the user used (Vietnamese if Vietnamese, English if English).
2. Real-time feedback on speaking pace, grammar, STAR structure, and Impact Score (0-100).

Return ONLY valid JSON:
{
  "next_question": "Follow-up question",
  "metrics": {
    "pace": "135 wpm (Optimal)",
    "grammar": "94%%",
    "structure": "STAR Framework (8/10)",
    "impact_score": 88
  }
}`, input.UserMessage)

	if sharedLLM == nil {
		c.JSON(http.StatusOK, gin.H{
			"next_question": "Cảm ơn câu trả lời của bạn! Bạn có thể chia sẻ thêm về một thử thách lớn nhất bạn từng vượt qua không?",
			"metrics": gin.H{
				"pace":         "130 wpm (Tự nhiên)",
				"grammar":      "92%",
				"structure":    "STAR Framework (8/10)",
				"impact_score": 85,
			},
		})
		return
	}

	req := llm.Request{
		Capability: "interview-sim",
		Prompt:     prompt,
	}
	resp, err := sharedLLM.Generate(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"next_question": "Cảm ơn câu trả lời của bạn! Bạn có thể chia sẻ thêm về một thử thách lớn nhất bạn từng vượt qua không?",
			"metrics": gin.H{
				"pace":         "130 wpm (Tự nhiên)",
				"grammar":      "92%",
				"structure":    "STAR Framework (8/10)",
				"impact_score": 85,
			},
		})
		return
	}

	var result gin.H
	if err := json.Unmarshal([]byte(CleanJSONResponse(resp.Text)), &result); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"next_question": "Rất ấn tượng! Tầm nhìn 5 năm tới của bạn tại trường là gì?",
			"metrics": gin.H{
				"pace":         "135 wpm",
				"grammar":      "90%",
				"structure":    "STAR (8/10)",
				"impact_score": 88,
			},
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

type ExtractCVInput struct {
	Text string `json:"text"`
	// FileData/MimeType carry the original CV file (PDF or image) so Gemini
	// can read it directly when there's no usable text layer — e.g. a
	// scanned CV, or a photo saved as a PDF. Optional; Text-only still works.
	FileData []byte `json:"file_data"`
	MimeType string `json:"mime_type"`
}

const extractCVSchemaPrompt = `Required JSON format:
{
  "gpa": float (extract exact GPA, use null if missing),
  "ielts": float (extract exact IELTS, use null if missing),
  "sat": int (extract exact SAT, use null if missing),
  "major": "string (extract exact major, use null if missing)",
  "researchProjects": ["string", "string"] (use empty array if none),
  "extracurriculars": ["string", "string"] (use empty array if none),
  "awards": ["string"] (use empty array if none),
  "hiddenStrengths": ["string", "string", "string"],
  "lorStatus": "string (e.g. 'Đã có 2 thư giới thiệu' or null if not mentioned)"
}`

func ExtractCV(c *gin.Context) {
	var input ExtractCVInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if strings.TrimSpace(input.Text) == "" && len(input.FileData) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không tìm thấy nội dung CV để trích xuất. Vui lòng tải lên lại file CV."})
		return
	}

	if sharedLLM == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No LLM provider configured"})
		return
	}

	req := llm.Request{Capability: "extract-cv"}

	if len(input.FileData) > 0 {
		mimeType := input.MimeType
		if mimeType == "" {
			mimeType = "application/pdf"
		}
		req.Files = []llm.File{{MIMEType: mimeType, Data: input.FileData}}
		req.Prompt = fmt.Sprintf("You are an expert HR and Admissions AI. Read the attached CV file and extract the following information. Return ONLY a valid JSON object, no other text.\n\n%s", extractCVSchemaPrompt)
	} else {
		req.Prompt = fmt.Sprintf("You are an expert HR and Admissions AI. Extract the following information from the given CV text and return ONLY a valid JSON object.\nCV Text: %s\n\n%s", input.Text, extractCVSchemaPrompt)
	}

	resp, err := sharedLLM.Generate(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var result gin.H
	if err := json.Unmarshal([]byte(CleanJSONResponse(resp.Text)), &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI không đọc được nội dung CV này. Vui lòng kiểm tra file có văn bản/hình ảnh rõ ràng rồi thử lại."})
		return
	}

	c.JSON(http.StatusOK, result)
}

// normalizeCountryName maps common aliases (Vietnamese names, abbreviations,
// shorthand) to the canonical English country name stored in the database.
func normalizeCountryName(input string) string {
	aliases := map[string]string{
		// United States
		"usa": "United States", "us": "United States", "u.s.": "United States",
		"u.s.a.": "United States", "mỹ": "United States", "my": "United States",
		"hoa kỳ": "United States", "america": "United States",
		"united states": "United States", "united states of america": "United States",
		// United Kingdom
		"uk": "United Kingdom", "u.k.": "United Kingdom", "anh": "United Kingdom",
		"england": "United Kingdom", "britain": "United Kingdom",
		"great britain": "United Kingdom", "united kingdom": "United Kingdom",
		"nước anh": "United Kingdom",
		// Australia
		"úc": "Australia", "uc": "Australia",
		"australia": "Australia", "aus": "Australia",
		// Canada
		"canada": "Canada", "ca": "Canada",
		// Singapore
		"singapore": "Singapore", "sg": "Singapore",
		// Japan
		"japan": "Japan", "nhật": "Japan", "nhật bản": "Japan", "nhat ban": "Japan", "jp": "Japan",
		// South Korea
		"south korea": "South Korea", "korea": "South Korea", "hàn quốc": "South Korea",
		"han quoc": "South Korea", "kr": "South Korea",
		// Germany
		"germany": "Germany", "đức": "Germany", "duc": "Germany", "de": "Germany",
		// France
		"france": "France", "pháp": "France", "phap": "France", "fr": "France",
		// Netherlands
		"netherlands": "Netherlands", "hà lan": "Netherlands", "ha lan": "Netherlands",
		"holland": "Netherlands", "nl": "Netherlands",
		// Switzerland
		"switzerland": "Switzerland", "thụy sĩ": "Switzerland", "thuy si": "Switzerland",
		// New Zealand
		"new zealand": "New Zealand", "nz": "New Zealand",
		// China
		"china": "China", "trung quốc": "China", "trung quoc": "China", "cn": "China",
		// Europe (broad)
		"châu âu": "Europe", "chau au": "Europe", "europe": "Europe",
	}
	lower := strings.ToLower(strings.TrimSpace(input))
	if canonical, ok := aliases[lower]; ok {
		return canonical
	}
	return input // return as-is if no alias found
}

func isEuropeanCountry(country string) bool {
	european := map[string]bool{
		"United Kingdom": true, "Germany": true, "France": true,
		"Netherlands": true, "Switzerland": true, "Sweden": true,
		"Denmark": true, "Norway": true, "Finland": true,
		"Ireland": true, "Belgium": true, "Austria": true,
		"Italy": true, "Spain": true, "Portugal": true,
		"Czech Republic": true, "Poland": true, "Hungary": true,
	}
	return european[country]
}
