package llm

import (
	"context"
	"log"
)

// failoverClient tries primary first; secondary only runs after primary has
// already exhausted its own internal retries (each provider retries
// transient errors 3 times before returning), so falling over here means the
// primary provider itself is down/exhausted/misconfigured, not just a single
// flaky request.
type failoverClient struct {
	primary   Client
	secondary Client
}

func (f *failoverClient) Generate(ctx context.Context, r Request) (Response, error) {
	resp, err := f.primary.Generate(ctx, r)
	if err == nil {
		return resp, nil
	}

	log.Printf("llm.failover capability=%s primary_error=%v switching_to=secondary", r.Capability, err)

	resp, secondaryErr := f.secondary.Generate(ctx, r)
	if secondaryErr != nil {
		log.Printf("llm.failover capability=%s secondary_error=%v -- both providers failed", r.Capability, secondaryErr)
		return Response{}, secondaryErr
	}
	return resp, nil
}
