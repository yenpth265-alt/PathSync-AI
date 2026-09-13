package llm

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestOpenAIClient(t *testing.T, handler http.HandlerFunc) *openaiClient {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	return &openaiClient{
		apiKey: "test-key",
		model:  "gpt-4o-mini",
		http:   server.Client(),
		apiURL: server.URL,
	}
}

func TestOpenAIClient_Generate_Success(t *testing.T) {
	client := newTestOpenAIClient(t, func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer test-key" {
			t.Errorf("Authorization header = %q, want Bearer test-key", got)
		}
		var body openaiChatRequest
		json.NewDecoder(r.Body).Decode(&body)
		if body.Messages[0].Content != "hello" {
			t.Errorf("prompt = %q, want hello", body.Messages[0].Content)
		}
		json.NewEncoder(w).Encode(openaiChatResponse{
			Choices: []struct {
				Message openaiChatMessage `json:"message"`
			}{{Message: openaiChatMessage{Role: "assistant", Content: "hi there"}}},
		})
	})

	resp, err := client.Generate(context.Background(), Request{Prompt: "hello"})
	if err != nil {
		t.Fatalf("Generate returned error: %v", err)
	}
	if resp.Text != "hi there" {
		t.Errorf("Text = %q, want %q", resp.Text, "hi there")
	}
}

func TestOpenAIClient_Generate_RefusesFileAttachments(t *testing.T) {
	client := newTestOpenAIClient(t, func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("should not have made an HTTP call when Files is set")
	})

	_, err := client.Generate(context.Background(), Request{
		Prompt: "read this",
		Files:  []File{{MIMEType: "application/pdf", Data: []byte("x")}},
	})
	if err == nil {
		t.Fatal("expected an error for a request carrying file attachments")
	}
}

func TestOpenAIClient_Generate_RetriesTransientErrors(t *testing.T) {
	attempts := 0
	client := newTestOpenAIClient(t, func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 3 {
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(openaiChatResponse{})
			return
		}
		json.NewEncoder(w).Encode(openaiChatResponse{
			Choices: []struct {
				Message openaiChatMessage `json:"message"`
			}{{Message: openaiChatMessage{Content: "recovered"}}},
		})
	})

	resp, err := client.Generate(context.Background(), Request{Prompt: "hello"})
	if err != nil {
		t.Fatalf("Generate returned error after retries should have recovered: %v", err)
	}
	if resp.Text != "recovered" {
		t.Errorf("Text = %q, want recovered", resp.Text)
	}
	if attempts != 3 {
		t.Errorf("attempts = %d, want 3", attempts)
	}
}

func TestOpenAIClient_Generate_NonRetryableErrorFailsFast(t *testing.T) {
	attempts := 0
	client := newTestOpenAIClient(t, func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(openaiChatResponse{
			Error: &struct {
				Message string `json:"message"`
			}{Message: "invalid api key"},
		})
	})

	_, err := client.Generate(context.Background(), Request{Prompt: "hello"})
	if err == nil {
		t.Fatal("expected an error for an invalid API key")
	}
	if !strings.Contains(err.Error(), "invalid api key") {
		t.Errorf("error = %v, want it to surface the provider's message", err)
	}
	if attempts != 1 {
		t.Errorf("attempts = %d, want 1 (a 401 must not be retried)", attempts)
	}
}
