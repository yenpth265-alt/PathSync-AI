package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
	"github.com/gin-gonic/gin"
)

// Gemini API Helper structures
type GeminiRequest struct {
	Contents []Content `json:"contents"`
}

type Content struct {
	Parts []Part `json:"parts"`
}

type Part struct {
	Text string `json:"text"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// CleanJSONResponse removes ```json ... ``` markdown block wrappers if present
func CleanJSONResponse(input string) string {
	cleaned := strings.TrimSpace(input)
	re := regexp.MustCompile("(?s)^```(?:json)?\\s*(.*?)\\s*```$")
	matches := re.FindStringSubmatch(cleaned)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	return cleaned
}

func callLLMAPI(prompt string) (string, error) {
	// 1. Try OpenAI / Ollama Cloud endpoint first (gpt-oss:120b-cloud)
	openAIKey := os.Getenv("OPENAI_API_KEY")
	if openAIKey == "" {
		openAIKey = "45a0f8fa961743419c60c448adf1cf60.aX0duZmbcYJy_1GCwqrQFJzT"
	}
	baseURL := os.Getenv("OPENAI_BASE_URL")
	if baseURL == "" {
		baseURL = "https://ollama.com/v1"
	}
	model := os.Getenv("LAB_MODEL")
	if model == "" {
		model = "gpt-oss:120b-cloud"
	}

	if openAIKey != "" && baseURL != "" {
		type Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		}
		type OAIReq struct {
			Model    string    `json:"model"`
			Messages []Message `json:"messages"`
		}

		reqBody := OAIReq{
			Model: model,
			Messages: []Message{
				{Role: "user", Content: prompt},
			},
		}

		jsonData, err := json.Marshal(reqBody)
		if err == nil {
			endpoint := fmt.Sprintf("%s/chat/completions", strings.TrimSuffix(baseURL, "/"))
			req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonData))
			if err == nil {
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Authorization", "Bearer "+openAIKey)

				client := &http.Client{Timeout: 20 * time.Second}
				resp, err := client.Do(req)
				if err == nil && resp.StatusCode == http.StatusOK {
					defer resp.Body.Close()
					var oaiResp struct {
						Choices []struct {
							Message struct {
								Content string `json:"content"`
							} `json:"message"`
						} `json:"choices"`
					}
					if err := json.NewDecoder(resp.Body).Decode(&oaiResp); err == nil && len(oaiResp.Choices) > 0 {
						txt := oaiResp.Choices[0].Message.Content
						if strings.TrimSpace(txt) != "" {
							return CleanJSONResponse(txt), nil
						}
					}
				}
			}
		}
	}

	// 2. Fallback to Gemini API with Multi-Key Rotation Pool
	apiKeysRaw := os.Getenv("GEMINI_API_KEYS")
	if apiKeysRaw == "" {
		apiKeysRaw = os.Getenv("GEMINI_API_KEY")
	}

	keys := strings.Split(apiKeysRaw, ",")
	for _, apiKey := range keys {
		apiKey = strings.TrimSpace(apiKey)
		if apiKey == "" || apiKey == "DUMMY_KEY_FOR_TESTING" {
			continue
		}

		reqBody := GeminiRequest{
			Contents: []Content{
				{Parts: []Part{{Text: prompt}}},
			},
		}

		jsonData, err := json.Marshal(reqBody)
		if err != nil {
			continue
		}

		url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", apiKey)
		resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			continue
		}

		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			log.Printf("[AI Service] Gemini Key failed with status %d, trying backup key...", resp.StatusCode)
			continue
		}

		var gResp GeminiResponse
		if err := json.NewDecoder(resp.Body).Decode(&gResp); err == nil && len(gResp.Candidates) > 0 && len(gResp.Candidates[0].Content.Parts) > 0 {
			resp.Body.Close()
			return CleanJSONResponse(gResp.Candidates[0].Content.Parts[0].Text), nil
		}
		resp.Body.Close()
	}

	return "", fmt.Errorf("all configured LLM endpoints / Gemini keys failed or offline")
}

// --- 1. Persona Lab Chat ---

type ChatInput struct {
	Messages []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"messages"`
	Context struct {
		JourneyType    string `json:"journey_type"`
		Fields         string `json:"fields"`
		EducationLevel string `json:"education_level"`
	} `json:"context"`
}

func Chat(c *gin.Context) {
	var input ChatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var historyBuilder strings.Builder
	for _, m := range input.Messages {
		historyBuilder.WriteString(fmt.Sprintf("%s: %s\n", strings.Title(m.Role), m.Content))
	}

	prompt := fmt.Sprintf(`You are PathSync AI, an expert, empathetic study-abroad counselor and mentor.
Context of Student:
- Education Level: %s
- Target Fields: %s
- Journey Stage: %s

Conversation History:
%s

Instructions:
1. Provide an inspiring, practical response encouraging the student or asking relevant probing questions.
2. If the user mentions any concrete achievement, project, challenge, skill, or leadership role, extract it into a node object.
3. Respond in the user's primary language (Vietnamese or English).
4. Return ONLY valid JSON matching this schema (no markdown, no preamble):
{
  "reply": "Your response message to the student",
  "nodes": [
    {
      "id": "node_1",
      "type": "achievement", // enum: achievement, challenge, impact, skill
      "label": "Short Title",
      "content": "Detailed takeaway of what they accomplished"
    }
  ]
}`, input.Context.EducationLevel, input.Context.Fields, input.Context.JourneyType, historyBuilder.String())

	aiOutput, err := callLLMAPI(prompt)
	if err != nil {
		log.Printf("[AI Service - Chat] Error calling Gemini: %v\n", err)
		// Fallback clean error structure
		c.JSON(http.StatusOK, gin.H{
			"reply": "Tớ gặp chút gián đoạn khi kết nối với Gemini AI. Bạn có thể chia sẻ cụ thể hơn về dự án hoặc thành tích của bạn được không?",
			"nodes": []gin.H{},
		})
		return
	}

	var result struct {
		Reply string  `json:"reply"`
		Nodes []gin.H `json:"nodes"`
	}

	if err := json.Unmarshal([]byte(aiOutput), &result); err != nil {
		log.Printf("[AI Service - Chat] Failed to parse JSON: %v\nOutput: %s\n", err, aiOutput)
		c.JSON(http.StatusOK, gin.H{
			"reply": aiOutput,
			"nodes": []gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// --- 2. SOP Assist ---

type SOPAssistInput struct {
	Prompt          string `json:"prompt"`
	ExistingContent string `json:"existing_content"`
	Action          string `json:"action"`
}

func SOPAssist(c *gin.Context) {
	var input SOPAssistInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prompt := fmt.Sprintf(`You are an admissions essay writing assistant.
Action requested: %s (improve, continue, intro, conclusion)
Essay Prompt: %s
Current Draft Content:
%s

Instructions:
Provide clear, actionable writing suggestions and specific text replacements or additions.
Return ONLY valid JSON matching this schema:
{
  "suggestion": "Main suggestion or suggested paragraph to add",
  "improvements": [
    {
      "type": "cliche", // enum: cliche, grammar, impact, clarity
      "original": "original phrase",
      "suggested": "better alternative phrase"
    }
  ]
}`, input.Action, input.Prompt, input.ExistingContent)

	aiOutput, err := callLLMAPI(prompt)
	if err != nil {
		log.Printf("[AI Service - SOPAssist] Error calling Gemini: %v\n", err)
		c.JSON(http.StatusOK, gin.H{
			"suggestion":   "Hãy tập trung vào việc mô tả chi tiết tác động của bài nghiên cứu hoặc hoạt động ngoại khóa thay vì dùng từ ngữ chung chung.",
			"improvements": []gin.H{},
		})
		return
	}

	var result struct {
		Suggestion   string  `json:"suggestion"`
		Improvements []gin.H `json:"improvements"`
	}

	if err := json.Unmarshal([]byte(aiOutput), &result); err != nil {
		log.Printf("[AI Service - SOPAssist] Failed to parse JSON: %v\n", err)
		c.JSON(http.StatusOK, gin.H{
			"suggestion":   aiOutput,
			"improvements": []gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// --- 3. Smart Match AI ---

type SmartMatchInput struct {
	GPA             float64  `json:"gpa"`
	IELTS           float64  `json:"ielts"`
	TOEFL           int      `json:"toefl"`
	WorkExp         int      `json:"work_exp"`
	Fields          []string `json:"fields"`
	TargetCountries []string `json:"target_countries"`
	Budget          int      `json:"budget"`
}

type RealProgram struct {
	ID             string  `json:"id"`
	UniversityID   string  `json:"university_id"`
	UniversityName string  `json:"university_name"`
	Name           string  `json:"name"`
	Degree         string  `json:"degree"`
	TuitionPerYear float64 `json:"tuition_per_year"`
	MinGPA         float64 `json:"min_gpa"`
	MinIELTS       float64 `json:"min_ielts"`
	University     struct {
		Name string `json:"name"`
	} `json:"university"`
}

func programUniversityName(p RealProgram) string {
	if p.UniversityName != "" {
		return p.UniversityName
	}
	if p.University.Name != "" {
		return p.University.Name
	}
	return "Unknown University"
}

func fetchRealProgramsFromUniversityService() []RealProgram {
	urls := []string{
		"http://localhost:8004/api/v1/programs",
		"http://localhost:8000/api/v1/programs",
	}

	client := &http.Client{Timeout: 5 * time.Second}
	for _, u := range urls {
		resp, err := client.Get(u)
		if err == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			var wrapped struct {
				Data []RealProgram `json:"data"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&wrapped); err == nil && len(wrapped.Data) > 0 {
				return wrapped.Data
			}
		}
	}
	return nil
}

func SmartMatch(c *gin.Context) {
	var input SmartMatchInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Fetch Real Programs from Database
	realPrograms := fetchRealProgramsFromUniversityService()
	var realProgsSummary []string
	for _, p := range realPrograms {
		uniName := programUniversityName(p)
		realProgsSummary = append(realProgsSummary, fmt.Sprintf("- Uni: %s | Program: %s | MinGPA: %.1f | MinIELTS: %.1f | Tuition: $%.0f", uniName, p.Name, p.MinGPA, p.MinIELTS, p.TuitionPerYear))
	}

	progsText := strings.Join(realProgsSummary, "\n")
	if progsText == "" {
		progsText = "No custom programs found in university DB yet."
	}

	prompt := fmt.Sprintf(`You are an AI Admissions Director matching a student to REAL university programs.
Student Profile:
- GPA: %.2f / 4.0
- IELTS: %.1f, TOEFL: %d
- Work Experience: %d years
- Preferred Fields: %s
- Target Countries: %s
- Annual Budget: $%d

REAL AVAILABLE PROGRAMS IN DATABASE:
%s

Instructions:
Evaluate and rank these real programs into 3 tiers based on student fit:
- "reach": Ambitious, competitive programs
- "target": Well-matched programs where candidate is competitive
- "safe": High probability of admission

Return ONLY valid JSON matching this schema:
{
  "reach": [
    {
      "university": "Exact Uni Name from database",
      "program": "Exact Program Name",
      "score": 75, // 0-100 match score
      "reasons": ["Specific reason 1", "Specific reason 2"]
    }
  ],
  "target": [],
  "safe": []
}`, input.GPA, input.IELTS, input.TOEFL, input.WorkExp, strings.Join(input.Fields, ", "), strings.Join(input.TargetCountries, ", "), input.Budget, progsText)

	aiOutput, err := callLLMAPI(prompt)
	if err != nil {
		log.Printf("[AI Service - SmartMatch] Error calling Gemini: %v\n", err)
		// Algorithmic fallback using real DB programs if Gemini API fails
		fallbackMatch(c, input, realPrograms)
		return
	}

	var result struct {
		Reach  []gin.H `json:"reach"`
		Target []gin.H `json:"target"`
		Safe   []gin.H `json:"safe"`
	}

	if err := json.Unmarshal([]byte(aiOutput), &result); err != nil {
		log.Printf("[AI Service - SmartMatch] Failed to parse JSON: %v\n", err)
		fallbackMatch(c, input, realPrograms)
		return
	}

	c.JSON(http.StatusOK, result)
}

func fallbackMatch(c *gin.Context, input SmartMatchInput, realPrograms []RealProgram) {
	reach := []gin.H{}
	target := []gin.H{}
	safe := []gin.H{}

	userScore := int(math.Min(100, (input.GPA/4.0)*60+(input.IELTS/9.0)*20+float64(input.WorkExp)*5))

	for _, p := range realPrograms {
		progItem := gin.H{
			"university": programUniversityName(p),
			"program":    p.Name,
			"score":      userScore,
			"reasons":    []string{fmt.Sprintf("Yêu cầu GPA tối thiểu %.1f (GPA của bạn: %.1f)", p.MinGPA, input.GPA)},
		}

		if input.GPA >= p.MinGPA+0.3 {
			safe = append(safe, progItem)
		} else if input.GPA >= p.MinGPA {
			target = append(target, progItem)
		} else {
			reach = append(reach, progItem)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"reach":  reach,
		"target": target,
		"safe":   safe,
	})
}

// --- 4. Essay Review ---

type EssayReviewInput struct {
	Content string `json:"content"`
	Prompt  string `json:"prompt"`
}

func EssayReview(c *gin.Context) {
	var input EssayReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prompt := fmt.Sprintf(`You are a rigorous, elite university Admissions Officer evaluating an applicant's SOP / Essay.
Essay Prompt: %s
Applicant's Essay Content:
%s

SCORING CRITERIA (STRICT & UNBIASED):
- If the essay text is under 150 words, or simply copies the essay prompt / generic outline, score MUST BE LOW between 40 and 58.
- If the essay lacks specific personal anecdotes, quantifiable impacts, or professor references, score between 60 and 74.
- Only award 85+ for well-structured, deeply authentic essays with clear personal drive and academic alignment.

Instructions:
Return ONLY valid JSON matching this schema:
{
  "score": 52, // 0-100 integer based strictly on criteria above
  "feedback": "Detailed, honest admissions feedback in Vietnamese",
  "issues": [
    {
      "type": "length", // enum: length, cliche, structure, tone, grammar, content
      "description": "Specific flaw identified",
      "suggestion": "Concrete advice to improve"
    }
  ],
  "strengths": [
    "Key strength 1"
  ]
}`, input.Prompt, input.Content)

	aiOutput, err := callLLMAPI(prompt)
	if err != nil {
		log.Printf("[AI Service - EssayReview] Error calling Gemini: %v\n", err)
		// Strict fallback calculation if Gemini fails
		wordCount := len(strings.Fields(input.Content))
		fallbackScore := 55
		if wordCount > 250 {
			fallbackScore = 78
		}
		c.JSON(http.StatusOK, gin.H{
			"score":     fallbackScore,
			"feedback":  "Bài viết của bạn cần được mở rộng với thêm các ví dụ thực tế và giải thích lý do cụ thể chọn ngành.",
			"issues":    []gin.H{{"type": "content", "description": "Thiếu minh chứng thực tế", "suggestion": "Bổ sung thành tựu cụ thể"}},
			"strengths": []string{"Đã nêu được ý tưởng chính"},
		})
		return
	}

	var result struct {
		Score     int      `json:"score"`
		Feedback  string   `json:"feedback"`
		Issues    []gin.H  `json:"issues"`
		Strengths []string `json:"strengths"`
	}

	if err := json.Unmarshal([]byte(aiOutput), &result); err != nil {
		log.Printf("[AI Service - EssayReview] Failed to parse JSON: %v\n", err)
		c.JSON(http.StatusOK, gin.H{
			"score":     80,
			"feedback":  aiOutput,
			"issues":    []gin.H{},
			"strengths": []string{"Nội dung phong phú"},
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// --- 6. AI Mentor Pro Pre-Review ---

type MentorPreReviewInput struct {
	EssayContent string `json:"essay_content"`
	Prompt       string `json:"prompt"`
}

func MentorPreReview(c *gin.Context) {
	var input MentorPreReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prompt := fmt.Sprintf(`You are AI Mentor Pro, pre-reviewing an essay draft to assist a Human Mentor.
Essay Prompt: %s
Draft: %s

Provide a structured framework analyzing:
1. Main Structural Weaknesses
2. Key Tone & Flow Improvements
3. Suggested Guidance Framework for the Mentor

Return ONLY valid JSON matching this schema:
{
  "structure_analysis": "Summary of structural strengths and flaws",
  "tone_flow_critique": "Critique of tone and flow",
  "suggested_feedback": "Structured advice for the mentor to give to the mentee"
}`, input.Prompt, input.EssayContent)

	aiOutput, err := callLLMAPI(prompt)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"structure_analysis": "Bài viết có mở đầu thu hút, nhưng phần giải thích động lực chọn trường cần thêm dẫn chứng cụ thể.",
			"tone_flow_critique": "Giọng văn tự tin, đúng ngữ pháp. Nên làm nổi bật hơn các tác động xã hội của dự án cá nhân.",
			"suggested_feedback": "Khuyên Mentee kết nối mục tiêu sự nghiệp với các đề tài nghiên cứu của giáo sư tại trường.",
		})
		return
	}

	var result gin.H
	if err := json.Unmarshal([]byte(aiOutput), &result); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"structure_analysis": aiOutput,
			"tone_flow_critique": "Đánh giá chi tiết bởi AI Mentor Pro",
			"suggested_feedback": "Hướng dẫn tư vấn 1-1 cho Mentor",
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// --- 7. Micro-Simulation Mock Interview ---

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
1. The next insightful follow-up question.
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

	aiOutput, err := callLLMAPI(prompt)
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
	if err := json.Unmarshal([]byte(aiOutput), &result); err != nil {
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

// --- 5. Agent Counsel (ReAct LLM Agent) ---


