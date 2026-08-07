package agent

import (
	"encoding/json"
	"testing"
)

func TestDetectIntent(t *testing.T) {
	cases := []struct {
		name  string
		input string
		want  string
	}{
		{"vietnamese university keyword", "Mình muốn tìm trường ở Canada", "university_search"},
		{"english university keyword", "What program fits my GPA?", "university_search"},
		{"tuition routes to search", "How much is tuition at UBC?", "university_search"},
		{"scholarship routes to search", "Có học bổng nào không?", "university_search"},
		{"vietnamese roadmap keyword", "Lập lộ trình nộp hồ sơ giúp mình", "roadmap"},
		{"english roadmap keyword", "Can you build a roadmap?", "roadmap"},
		{"deadline routes to roadmap", "When is the deadline?", "roadmap"},
		{"uppercase is normalized", "TÌM TRƯỜNG", "university_search"},
		{"fallback", "Chào bạn", "conversation"},
		{"empty input falls back", "", "conversation"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := detectIntent(tc.input); got != tc.want {
				t.Errorf("detectIntent(%q) = %q, want %q", tc.input, got, tc.want)
			}
		})
	}
}

// University keywords are checked before roadmap keywords, so an input carrying
// both resolves to university_search. Pinning this so a reordering of the
// branches in detectIntent does not silently change routing.
func TestDetectIntentPrecedence(t *testing.T) {
	if got := detectIntent("lộ trình nộp hồ sơ vào trường nào"); got != "university_search" {
		t.Errorf("expected university_search to win over roadmap, got %q", got)
	}
}

// The frontend reads schema_version, citations, safety_notice and degraded as
// top-level fields. Envelope is embedded so they flatten; this guards against
// someone converting it to a named field and breaking every AI response.
func TestEnvelopeFlattensToTopLevel(t *testing.T) {
	raw, err := json.Marshal(AgentResponse{
		Envelope: Envelope{
			SchemaVersion: responseSchemaVersion,
			SafetyNotice:  "verify on the official page",
			Degraded:      true,
			Citations:     []Citation{{Label: "UBC CS", URL: "https://example.com"}},
		},
		Reply: "hello",
	})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if _, nested := decoded["Envelope"]; nested {
		t.Fatal("Envelope serialized as a nested object; it must be embedded so its fields flatten")
	}
	for _, key := range []string{"schema_version", "safety_notice", "degraded", "citations", "reply"} {
		if _, ok := decoded[key]; !ok {
			t.Errorf("missing top-level key %q in %s", key, raw)
		}
	}
}

// degraded and citations are omitempty. A healthy response must omit degraded
// entirely rather than send false, and must not emit a null citations array.
func TestEnvelopeOmitsEmptyOptionalFields(t *testing.T) {
	raw, err := json.Marshal(AgentResponse{
		Envelope: Envelope{SchemaVersion: responseSchemaVersion},
		Reply:    "hello",
	})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	for _, key := range []string{"degraded", "citations", "safety_notice"} {
		if _, present := decoded[key]; present {
			t.Errorf("expected %q to be omitted when empty, got %s", key, raw)
		}
	}
	if decoded["schema_version"] != responseSchemaVersion {
		t.Errorf("schema_version = %v, want %q", decoded["schema_version"], responseSchemaVersion)
	}
}
