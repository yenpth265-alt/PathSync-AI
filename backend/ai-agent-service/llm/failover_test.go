package llm

import (
	"context"
	"errors"
	"testing"
)

// fakeClient is a minimal Client for testing failoverClient in isolation,
// without a real network call to either provider.
type fakeClient struct {
	response Response
	err      error
	calls    int
}

func (f *fakeClient) Generate(ctx context.Context, r Request) (Response, error) {
	f.calls++
	return f.response, f.err
}

func TestFailoverClient_PrimarySucceeds_SecondaryNeverCalled(t *testing.T) {
	primary := &fakeClient{response: Response{Text: "from primary"}}
	secondary := &fakeClient{response: Response{Text: "from secondary"}}
	client := &failoverClient{primary: primary, secondary: secondary}

	resp, err := client.Generate(context.Background(), Request{Prompt: "hi"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Text != "from primary" {
		t.Errorf("Text = %q, want from primary", resp.Text)
	}
	if secondary.calls != 0 {
		t.Errorf("secondary was called %d times, want 0 — failover must not run when primary succeeds", secondary.calls)
	}
}

func TestFailoverClient_PrimaryFails_FallsBackToSecondary(t *testing.T) {
	primary := &fakeClient{err: errors.New("primary is down")}
	secondary := &fakeClient{response: Response{Text: "from secondary"}}
	client := &failoverClient{primary: primary, secondary: secondary}

	resp, err := client.Generate(context.Background(), Request{Prompt: "hi"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Text != "from secondary" {
		t.Errorf("Text = %q, want from secondary", resp.Text)
	}
	if secondary.calls != 1 {
		t.Errorf("secondary was called %d times, want 1", secondary.calls)
	}
}

func TestFailoverClient_BothFail_ReturnsSecondaryError(t *testing.T) {
	primary := &fakeClient{err: errors.New("primary is down")}
	secondary := &fakeClient{err: errors.New("secondary is also down")}
	client := &failoverClient{primary: primary, secondary: secondary}

	_, err := client.Generate(context.Background(), Request{Prompt: "hi"})
	if err == nil {
		t.Fatal("expected an error when both providers fail")
	}
	if err.Error() != "secondary is also down" {
		t.Errorf("error = %v, want the secondary's own error surfaced", err)
	}
}
