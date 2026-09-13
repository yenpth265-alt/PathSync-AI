// Package llm is the single boundary between this service and any LLM provider.
//
// Every model call in the AI module goes through Client.Generate. That is what
// makes provider config, retry policy, and cost accounting properties of the
// module rather than of whichever handler was written last.
package llm

import (
	"context"
	"errors"
	"os"
	"strconv"
	"time"
)

// ErrNotConfigured means no provider credential is present.
//
// Callers MUST render a degraded response: say the model is unavailable and
// return no model-derived content. Fabricating plausible output — a score for
// an essay that was never read, a suggestion that was never generated — is the
// one forbidden fallback. A default local run has no key, so this is the
// normal path, not an edge case.
var ErrNotConfigured = errors.New("llm: no provider configured")

// File is inline binary input (PDF, audio) sent alongside the prompt.
type File struct {
	MIMEType string
	Data     []byte
}

// Request is one model call.
type Request struct {
	// Capability labels the call site for the cost log: "counsel", "extract",
	// "essay", "match", "sop". It is the dimension we group spend by.
	Capability string

	Prompt string

	// Files are sent inline with the prompt. Gemini accepts PDF bytes
	// directly, which is why extraction needs no OCR stage.
	Files []File

	// JSONSchema, when non-nil, puts the provider in JSON mode and enforces
	// the schema. Pass a *genai.Schema.
	JSONSchema any

	Temperature float32
	MaxTokens   int
}

// Usage is read from the provider's response, not estimated.
type Usage struct {
	Model            string
	PromptTokens     int
	CompletionTokens int
	LatencyMS        int64
}

type Response struct {
	Text  string
	Usage Usage
}

// Client is the interface every capability calls. Two implementations today
// (Gemini, OpenAI) — the interface is what lets New() wire them into a
// failover pair without touching callers.
type Client interface {
	Generate(ctx context.Context, r Request) (Response, error)
}

// New returns the configured provider client, or ErrNotConfigured when no
// credential is present for either provider. Callers should treat that error
// as a degradation signal, not a fatal one.
//
// Gemini is primary — it's the only one that reads file attachments
// natively (see File above), which every extraction endpoint depends on.
// OpenAI, when OPENAI_API_KEY is also set, serves as failover for text-only
// capabilities: if Gemini's own internal retries are exhausted (see
// gemini.go), failoverClient tries OpenAI before giving up. With only one
// key set, that provider runs alone — no wrapper, no behavior change from
// before this existed.
func New() (Client, error) {
	primary, primaryErr := newGemini()
	secondary, secondaryErr := newOpenAI()

	var client Client
	switch {
	case primaryErr == nil && secondaryErr == nil:
		client = &failoverClient{primary: primary, secondary: secondary}
	case primaryErr == nil:
		client = primary
	case secondaryErr == nil:
		client = secondary
	default:
		return nil, ErrNotConfigured
	}

	// Caching wraps whichever provider(s) ended up configured — a cache hit
	// is valid no matter which one would have served the request. See
	// cache.go for why exact-hash matching, not semantic similarity.
	if os.Getenv("LLM_CACHE_DISABLED") == "true" {
		return client, nil
	}
	return newCachingClient(client, cacheTTL()), nil
}

func cacheTTL() time.Duration {
	const fallbackMinutes = 60
	if v := os.Getenv("LLM_CACHE_TTL_MINUTES"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return time.Duration(n) * time.Minute
		}
	}
	return fallbackMinutes * time.Minute
}
