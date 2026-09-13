package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// openaiClient talks to the Chat Completions REST endpoint directly rather
// than pulling in an SDK — this service has exactly one call site for it
// (Generate), so a full client library buys nothing an http.Client and two
// structs don't already give it.
//
// Scope: text only. OpenAI has no equivalent of Gemini's "attach raw PDF
// bytes, read them natively" path (see client.go's File type) without a
// materially different integration (per-page image conversion, or the
// Assistants/Files API) — out of scope for a failover provider. A request
// carrying Files returns an explicit error rather than silently dropping
// them, so a caller relying on file content never gets a response that
// quietly ignored what it uploaded.
type openaiClient struct {
	apiKey string
	model  string
	http   *http.Client
	apiURL string // overridable in tests
}

func newOpenAI() (Client, error) {
	key := strings.TrimSpace(os.Getenv("OPENAI_API_KEY"))
	if key == "" {
		return nil, ErrNotConfigured
	}

	model := strings.TrimSpace(os.Getenv("OPENAI_MODEL"))
	if model == "" {
		model = "gpt-4o-mini"
	}

	return &openaiClient{
		apiKey: key,
		model:  model,
		http:   &http.Client{Timeout: 30 * time.Second},
		apiURL: "https://api.openai.com/v1/chat/completions",
	}, nil
}

type openaiChatRequest struct {
	Model       string              `json:"model"`
	Messages    []openaiChatMessage `json:"messages"`
	Temperature float32             `json:"temperature,omitempty"`
	MaxTokens   int                 `json:"max_tokens,omitempty"`
}

type openaiChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openaiChatResponse struct {
	Choices []struct {
		Message openaiChatMessage `json:"message"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (o *openaiClient) Generate(ctx context.Context, r Request) (Response, error) {
	if len(r.Files) > 0 {
		return Response{}, errors.New("llm: openai provider does not support file attachments")
	}

	start := time.Now()

	reqBody := openaiChatRequest{
		Model:       o.model,
		Messages:    []openaiChatMessage{{Role: "user", Content: r.Prompt}},
		Temperature: r.Temperature,
		MaxTokens:   r.MaxTokens,
	}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return Response{}, fmt.Errorf("llm: marshal openai request: %w", err)
	}

	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		if attempt > 0 {
			time.Sleep(500 * time.Millisecond)
		}

		resp, err := o.doRequest(ctx, body)
		if err != nil {
			lastErr = err
			if shouldRetry(err) {
				continue
			}
			return Response{}, err
		}

		text := ""
		if len(resp.Choices) > 0 {
			text = resp.Choices[0].Message.Content
		}
		usage := Usage{
			Model:            o.model,
			PromptTokens:     resp.Usage.PromptTokens,
			CompletionTokens: resp.Usage.CompletionTokens,
			LatencyMS:        time.Since(start).Milliseconds(),
		}

		log.Printf("llm.call capability=%s model=%s prompt_tokens=%d completion_tokens=%d latency_ms=%d",
			r.Capability, usage.Model, usage.PromptTokens, usage.CompletionTokens, usage.LatencyMS)

		return Response{Text: text, Usage: usage}, nil
	}

	return Response{}, lastErr
}

func (o *openaiClient) doRequest(ctx context.Context, body []byte) (*openaiChatResponse, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, o.apiURL, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+o.apiKey)

	httpResp, err := o.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()

	respBytes, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, err
	}

	var parsed openaiChatResponse
	if err := json.Unmarshal(respBytes, &parsed); err != nil {
		return nil, fmt.Errorf("llm: decode openai response: %w", err)
	}

	if httpResp.StatusCode != http.StatusOK {
		msg := string(respBytes)
		if parsed.Error != nil && parsed.Error.Message != "" {
			msg = parsed.Error.Message
		}
		return nil, fmt.Errorf("openai returned %d: %s", httpResp.StatusCode, msg)
	}

	return &parsed, nil
}
