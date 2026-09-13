package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"pathsync-ai-agent-service/agent"
	"pathsync-ai-agent-service/database"
	"pathsync-ai-agent-service/llm"
)

// ExtractActionsInput mirrors ExtractCVInput's Text/FileData/MimeType shape
// (classic.go) — the same "send bytes to Gemini directly, no OCR stage"
// pattern applies here.
type ExtractActionsInput struct {
	Text     string `json:"text"`
	FileData []byte `json:"file_data"`
	MimeType string `json:"mime_type"`
}

// rawExtractedAction is exactly what the model returns — a proposal, not a
// verified fact. buildExtractedAction below is what turns it into something
// safe to show the user.
type rawExtractedAction struct {
	Title        string  `json:"title"`
	Category     string  `json:"category"`
	RawDateText  string  `json:"raw_date_text"`
	EvidenceSpan string  `json:"evidence_span"`
	AIConfidence float64 `json:"ai_confidence"`
}

// ExtractedAction is one deadline/checklist item surfaced for the user to
// review. Nothing derived from it is written to a Kanban card until the user
// explicitly approves it in the frontend — the same
// confirm-before-mutate contract agent.ProposedAction uses for chat-suggested
// actions (agent/agent.go).
type ExtractedAction struct {
	Title       string `json:"title"`
	Category    string `json:"category"`
	RawDateText string `json:"raw_date_text"`
	// ParsedDate is "2006-01-02", or empty when parseFlexibleDate could not
	// resolve RawDateText — never a guess dressed up as a real date.
	ParsedDate    string `json:"parsed_date,omitempty"`
	DateAmbiguous bool   `json:"date_ambiguous,omitempty"`
	EvidenceSpan  string `json:"evidence_span"`
	// EvidenceVerified is nil when there was no extracted source text to
	// check the span against (e.g. a scanned image with no text layer) —
	// distinct from false, which means the check ran and the span was not
	// found verbatim in the source.
	EvidenceVerified *bool   `json:"evidence_verified"`
	Confidence       float64 `json:"confidence"`
	NeedsReview      bool    `json:"needs_review"`
}

type ExtractActionsResponse struct {
	agent.Envelope
	Actions []ExtractedAction `json:"actions"`
}

func ExtractActions(c *gin.Context) {
	var input ExtractActionsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if strings.TrimSpace(input.Text) == "" && len(input.FileData) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không tìm thấy nội dung tài liệu để trích xuất. Vui lòng tải lên lại file."})
		return
	}

	if sharedLLM == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No LLM provider configured"})
		return
	}

	inputKind := "pdf_text"
	if len(input.FileData) > 0 {
		inputKind = "pdf_file"
		if strings.HasPrefix(input.MimeType, "image/") {
			inputKind = "image"
		}
	}
	fileSize := len(input.FileData)
	started := time.Now()

	req := llm.Request{Capability: "extract-actions"}
	if len(input.FileData) > 0 {
		mimeType := input.MimeType
		if mimeType == "" {
			mimeType = "application/pdf"
		}
		req.Files = []llm.File{{MIMEType: mimeType, Data: input.FileData}}
		req.Prompt = "You are an expert admissions coordinator. Read the attached file and extract deadlines/required items.\n\n" + extractActionsSchemaPrompt
	} else {
		req.Prompt = "Document text:\n" + input.Text + "\n\n" + extractActionsSchemaPrompt
	}

	resp, err := sharedLLM.Generate(c.Request.Context(), req)
	if err != nil {
		recordExtractionMetric(c, inputKind, fileSize, nil, time.Since(started), false)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var parsed struct {
		Actions []rawExtractedAction `json:"actions"`
	}
	if err := json.Unmarshal([]byte(CleanJSONResponse(resp.Text)), &parsed); err != nil {
		recordExtractionMetric(c, inputKind, fileSize, nil, time.Since(started), false)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI không đọc được tài liệu này. Vui lòng kiểm tra file có nội dung rõ ràng rồi thử lại."})
		return
	}

	actions := make([]ExtractedAction, 0, len(parsed.Actions))
	for _, raw := range parsed.Actions {
		actions = append(actions, buildExtractedAction(raw, input.Text))
	}

	recordExtractionMetric(c, inputKind, fileSize, actions, time.Since(started), true)

	c.JSON(http.StatusOK, ExtractActionsResponse{
		Envelope: agent.Envelope{
			SchemaVersion: "2026-08",
			SafetyNotice:  "Ngày tháng được một lớp mã kiểm tra lại chứ không phải AI tự tính; hãy xem lại từng mốc trước khi lưu vào Kanban.",
		},
		Actions: actions,
	})
}

// recordExtractionMetric persists one row so the pitch's "trung bình 3,2
// giây/tệp" style claim can be answered from GetExtractionMetrics
// (metrics.go) instead of asserted. Best-effort: a logging failure must never
// break the actual extraction response the user is waiting on.
func recordExtractionMetric(c *gin.Context, inputKind string, fileSize int, actions []ExtractedAction, elapsed time.Duration, success bool) {
	if database.DB == nil {
		return
	}

	avgConfidence := 0.0
	if len(actions) > 0 {
		sum := 0.0
		for _, a := range actions {
			sum += a.Confidence
		}
		avgConfidence = sum / float64(len(actions))
	}

	metric := database.ExtractionMetric{
		ID:            uuid.NewString(),
		UserID:        c.GetString("userID"),
		InputKind:     inputKind,
		FileSize:      fileSize,
		ActionsFound:  len(actions),
		AvgConfidence: avgConfidence,
		LatencyMS:     elapsed.Milliseconds(),
		Success:       success,
	}
	if err := database.DB.Create(&metric).Error; err != nil {
		log.Printf("[ExtractActions] failed to record extraction metric: %v", err)
	}
}

// buildExtractedAction is the confidence-scoring core of the endpoint. It
// combines three independent signals rather than trusting the model's
// self-reported ai_confidence alone:
//  1. the model's own confidence,
//  2. whether the deterministic date parser could resolve raw_date_text,
//  3. whether evidence_span is actually verbatim in the source text —
//     the strongest available signal against a fabricated deadline, since
//     the model cannot know in advance which exact substring will be checked.
func buildExtractedAction(raw rawExtractedAction, sourceText string) ExtractedAction {
	result := ExtractedAction{
		Title:        strings.TrimSpace(raw.Title),
		Category:     strings.TrimSpace(raw.Category),
		RawDateText:  strings.TrimSpace(raw.RawDateText),
		EvidenceSpan: strings.TrimSpace(raw.EvidenceSpan),
	}

	confidence := clamp01(raw.AIConfidence)

	if result.RawDateText != "" {
		if pd, ok := parseFlexibleDate(result.RawDateText); ok {
			result.ParsedDate = pd.Time.Format("2006-01-02")
			result.DateAmbiguous = pd.Ambiguous
			if pd.Ambiguous {
				confidence *= 0.75
			}
		} else {
			// A date was stated but not independently resolvable — trust the
			// model's raw string less, not more, when it can't be checked.
			confidence *= 0.4
			result.NeedsReview = true
		}
	}

	if strings.TrimSpace(sourceText) != "" && result.EvidenceSpan != "" {
		verified := containsFold(sourceText, result.EvidenceSpan)
		result.EvidenceVerified = &verified
		if verified {
			confidence = clamp01(confidence + 0.15)
		} else {
			confidence *= 0.3
			result.NeedsReview = true
		}
	}

	result.Confidence = confidence
	if confidence < 0.5 {
		result.NeedsReview = true
	}
	return result
}

func containsFold(haystack, needle string) bool {
	return strings.Contains(
		strings.ToLower(normalizeWhitespace(haystack)),
		strings.ToLower(normalizeWhitespace(needle)),
	)
}

func normalizeWhitespace(s string) string {
	return strings.Join(strings.Fields(s), " ")
}

func clamp01(f float64) float64 {
	if f < 0 {
		return 0
	}
	if f > 1 {
		return 1
	}
	return f
}
