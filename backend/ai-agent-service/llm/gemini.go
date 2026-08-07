package llm

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type geminiClient struct {
	model     *genai.GenerativeModel
	modelName string
}

// newGemini returns a Gemini client or ErrNotConfigured.
//
// Model is read from GEMINI_MODEL; the default is a current Flash release —
// never hardcoded in a URL, never overridden in a handler. That closes N1.
func newGemini() (Client, error) {
	key := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
	if key == "" {
		return nil, ErrNotConfigured
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := genai.NewClient(ctx, option.WithAPIKey(key))
	if err != nil {
		return nil, fmt.Errorf("llm: genai.NewClient: %w", err)
	}

	modelName := strings.TrimSpace(os.Getenv("GEMINI_MODEL"))
	if modelName == "" {
		modelName = "gemini-1.5-flash"
	}

	return &geminiClient{
		model:     client.GenerativeModel(modelName),
		modelName: modelName,
	}, nil
}

func (g *geminiClient) Generate(ctx context.Context, r Request) (Response, error) {
	start := time.Now()

	parts := []genai.Part{genai.Text(r.Prompt)}
	for _, f := range r.Files {
		parts = append(parts, genai.Blob{MIMEType: f.MIMEType, Data: f.Data})
	}

	// Per-request copy: sharedLLM is one instance serving concurrent Gin
	// handlers, so per-call generation settings must not touch g.model.
	model := *g.model

	if schema, ok := r.JSONSchema.(*genai.Schema); ok && schema != nil {
		model.ResponseMIMEType = "application/json"
		model.ResponseSchema = schema
	}
	if r.MaxTokens > 0 {
		model.SetMaxOutputTokens(int32(r.MaxTokens))
	}
	if r.Temperature > 0 {
		model.SetTemperature(r.Temperature)
	}

	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		if attempt > 0 {
			time.Sleep(500 * time.Millisecond)
		}

		resp, err := model.GenerateContent(ctx, parts...)
		if err != nil {
			lastErr = err
			if shouldRetry(err) {
				continue
			}
			return Response{}, err
		}

		text := responseText(resp)
		usage := extractUsage(resp, time.Since(start), g.modelName)

		log.Printf("llm.call capability=%s model=%s prompt_tokens=%d completion_tokens=%d latency_ms=%d",
			r.Capability, usage.Model, usage.PromptTokens, usage.CompletionTokens, usage.LatencyMS)

		return Response{Text: text, Usage: usage}, nil
	}

	return Response{}, lastErr
}

func shouldRetry(err error) bool {
	s := err.Error()
	return strings.Contains(s, "500") || strings.Contains(s, "503") ||
		strings.Contains(s, "502") || strings.Contains(s, "unavailable") ||
		strings.Contains(s, "timeout") || strings.Contains(s, "DeadlineExceeded")
}

func responseText(resp *genai.GenerateContentResponse) string {
	if resp == nil || len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		return ""
	}
	var parts []string
	for _, p := range resp.Candidates[0].Content.Parts {
		parts = append(parts, fmt.Sprint(p))
	}
	return strings.Join(parts, "")
}

func extractUsage(resp *genai.GenerateContentResponse, latency time.Duration, modelName string) Usage {
	u := Usage{LatencyMS: latency.Milliseconds(), Model: modelName}
	if resp != nil && resp.UsageMetadata != nil {
		u.PromptTokens = int(resp.UsageMetadata.PromptTokenCount)
		u.CompletionTokens = int(resp.UsageMetadata.CandidatesTokenCount)
	}
	return u
}
