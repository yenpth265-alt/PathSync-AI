package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
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

func callGeminiAPI(prompt string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		apiKey = "DUMMY_KEY_FOR_TESTING"
	}

	reqBody := GeminiRequest{
		Contents: []Content{
			{Parts: []Part{{Text: prompt}}},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", apiKey)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("Gemini API error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var gResp GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&gResp); err != nil {
		return "", err
	}

	if len(gResp.Candidates) == 0 || len(gResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from Gemini API")
	}

	return CleanJSONResponse(gResp.Candidates[0].Content.Parts[0].Text), nil
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

	aiOutput, err := callGeminiAPI(prompt)
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

	aiOutput, err := callGeminiAPI(prompt)
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

	aiOutput, err := callGeminiAPI(prompt)
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

	prompt := fmt.Sprintf(`You are a senior admissions committee reviewer evaluating an applicant's SOP / Essay.
Essay Prompt: %s
Applicant's Essay Content:
%s

Instructions:
Critique the essay thoroughly for structure, authenticity, impact, and alignment with prompt.
Return ONLY valid JSON matching this schema:
{
  "score": 85, // 0-100 integer
  "feedback": "Overall high-level feedback summary",
  "issues": [
    {
      "type": "structure", // enum: length, cliche, structure, tone, grammar
      "description": "Description of the flaw",
      "suggestion": "Concrete advice on how to rewrite or fix"
    }
  ],
  "strengths": [
    "Key strength 1",
    "Key strength 2"
  ]
}`, input.Prompt, input.Content)

	aiOutput, err := callGeminiAPI(prompt)
	if err != nil {
		log.Printf("[AI Service - EssayReview] Error calling Gemini: %v\n", err)
		c.JSON(http.StatusOK, gin.H{
			"score":     75,
			"feedback":  "Bài viết có bố cục ổn định nhưng cần phát triển rõ hơn các ví dụ cá nhân hóa.",
			"issues":    []gin.H{},
			"strengths": []string{"Cấu trúc mạch lạc", "Ngôn từ phù hợp"},
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

// --- 5. Agent Counsel (ReAct LLM Agent) ---


