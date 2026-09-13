package llm

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"sync"
	"time"
)

// cachingClient is Stage 1 of the pitch's "semantic caching cuts cost 40%"
// claim: exact-hash caching, not semantic similarity. Semantic caching needs
// embeddings and a vector store — real infrastructure that should be sized
// against an actual hit-rate number, not built on faith. This stage logs
// llm.cache hit/miss so that number can be measured first (see
// recordExtractionMetric in actions.go for the same measure-before-build
// philosophy applied to the "3,2 giây/tệp" claim).
//
// A cache hit requires the full rendered prompt (plus files, schema,
// temperature, max tokens) to match byte-for-byte. Two different users
// hitting the same cached entry is not a privacy concern: the prompt text
// already contains everything the response is computed from, so an
// identical prompt producing an identical response leaks nothing beyond
// what identical input already implies.
type cachingClient struct {
	mu      sync.Mutex
	entries map[string]cacheEntry
	ttl     time.Duration
	next    Client
}

type cacheEntry struct {
	response Response
	expires  time.Time
}

func newCachingClient(next Client, ttl time.Duration) *cachingClient {
	c := &cachingClient{
		entries: make(map[string]cacheEntry),
		ttl:     ttl,
		next:    next,
	}
	go c.sweep()
	return c
}

func (c *cachingClient) Generate(ctx context.Context, r Request) (Response, error) {
	key := cacheKey(r)

	c.mu.Lock()
	entry, ok := c.entries[key]
	c.mu.Unlock()
	if ok && time.Now().Before(entry.expires) {
		log.Printf("llm.cache capability=%s status=hit", r.Capability)
		return entry.response, nil
	}

	resp, err := c.next.Generate(ctx, r)
	if err != nil {
		return resp, err
	}

	c.mu.Lock()
	c.entries[key] = cacheEntry{response: resp, expires: time.Now().Add(c.ttl)}
	c.mu.Unlock()
	log.Printf("llm.cache capability=%s status=miss", r.Capability)
	return resp, nil
}

// cacheKey hashes everything Generate's output actually depends on. Missing
// a field here would let two meaningfully different requests collide;
// including something irrelevant would just cost a few extra cache misses,
// the safe direction to err in.
func cacheKey(r Request) string {
	h := sha256.New()
	h.Write([]byte(r.Capability))
	h.Write([]byte{0})
	h.Write([]byte(r.Prompt))
	for _, f := range r.Files {
		h.Write([]byte{0})
		h.Write([]byte(f.MIMEType))
		h.Write(f.Data)
	}
	fmt.Fprintf(h, "|schema=%v|temp=%f|maxtok=%d", r.JSONSchema, r.Temperature, r.MaxTokens)
	return hex.EncodeToString(h.Sum(nil))
}

func (c *cachingClient) sweep() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		c.mu.Lock()
		for key, entry := range c.entries {
			if now.After(entry.expires) {
				delete(c.entries, key)
			}
		}
		c.mu.Unlock()
	}
}
