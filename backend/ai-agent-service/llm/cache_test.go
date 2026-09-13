package llm

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestCachingClient_IdenticalRequest_HitsCacheNotUnderlying(t *testing.T) {
	inner := &fakeClient{response: Response{Text: "answer"}}
	client := newCachingClient(inner, time.Hour)

	req := Request{Capability: "sop", Prompt: "hello"}

	first, err := client.Generate(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if first.Text != "answer" {
		t.Fatalf("Text = %q, want answer", first.Text)
	}

	second, err := client.Generate(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if second.Text != "answer" {
		t.Errorf("Text = %q, want answer (from cache)", second.Text)
	}
	if inner.calls != 1 {
		t.Errorf("underlying client was called %d times, want 1 -- the second call should have hit cache", inner.calls)
	}
}

func TestCachingClient_DifferentPrompt_MissesCache(t *testing.T) {
	inner := &fakeClient{response: Response{Text: "answer"}}
	client := newCachingClient(inner, time.Hour)

	client.Generate(context.Background(), Request{Capability: "sop", Prompt: "hello"})
	client.Generate(context.Background(), Request{Capability: "sop", Prompt: "goodbye"})

	if inner.calls != 2 {
		t.Errorf("underlying client was called %d times, want 2 -- different prompts must not share a cache entry", inner.calls)
	}
}

func TestCachingClient_DifferentCapability_SamePrompt_MissesCache(t *testing.T) {
	// Two different capabilities can legitimately render the same literal
	// prompt string (e.g. a short shared instruction); they must not share a
	// cached answer meant for a different call site.
	inner := &fakeClient{response: Response{Text: "answer"}}
	client := newCachingClient(inner, time.Hour)

	client.Generate(context.Background(), Request{Capability: "sop", Prompt: "same text"})
	client.Generate(context.Background(), Request{Capability: "essay", Prompt: "same text"})

	if inner.calls != 2 {
		t.Errorf("underlying client was called %d times, want 2", inner.calls)
	}
}

func TestCachingClient_ExpiredEntry_MissesCache(t *testing.T) {
	inner := &fakeClient{response: Response{Text: "answer"}}
	client := newCachingClient(inner, 1*time.Millisecond)

	req := Request{Capability: "sop", Prompt: "hello"}
	client.Generate(context.Background(), req)
	time.Sleep(5 * time.Millisecond)
	client.Generate(context.Background(), req)

	if inner.calls != 2 {
		t.Errorf("underlying client was called %d times, want 2 -- an expired entry must not be served", inner.calls)
	}
}

func TestCachingClient_ErrorResponsesAreNotCached(t *testing.T) {
	inner := &fakeClient{err: errors.New("provider unavailable")}
	client := newCachingClient(inner, time.Hour)

	req := Request{Capability: "sop", Prompt: "hello"}
	client.Generate(context.Background(), req)
	client.Generate(context.Background(), req)

	if inner.calls != 2 {
		t.Errorf("underlying client was called %d times, want 2 -- a failed call must not poison the cache for the next attempt", inner.calls)
	}
}
