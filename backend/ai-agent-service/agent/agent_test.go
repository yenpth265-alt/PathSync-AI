package agent

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"pathsync-ai-agent-service/llm"
)

type stubLLM struct {
	text string
	err  error
}

func (s stubLLM) Generate(context.Context, llm.Request) (llm.Response, error) {
	return llm.Response{Text: s.text}, s.err
}

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

// The roadmap intent used to answer every question with the same five generic
// milestones. It now asks the model to rewrite them around the actual question,
// and falls back to the static list — marked degraded — when that fails. Both
// halves matter: a silent fallback is how the canned answer looked like an LLM.
func TestGenerateRoadmapUsesModelAndDegradesOnFailure(t *testing.T) {
	ctx := context.Background()
	ask := "Điểm IELTS Writing của mình là 6.0, cần cải thiện trước tháng 12"

	tailored := `{"summary":"Tập trung vào IELTS Writing.","tasks":[{"title":"Chấm chữa 2 bài Writing mỗi tuần","phase":"Luyện tập","priority":"high"}]}`

	cases := []struct {
		name         string
		llmClient    llm.Client
		wantDegraded bool
		wantInReply  string
		wantTask     string
	}{
		{"model output is used", stubLLM{text: tailored}, false, "IELTS Writing", "Chấm chữa"},
		{"fenced JSON is still parsed", stubLLM{text: "```json\n" + tailored + "\n```"}, false, "IELTS Writing", "Chấm chữa"},
		{"LLM error falls back", stubLLM{err: errors.New("boom")}, true, "Lộ trình chuẩn bị", "Xác định ngành"},
		{"unparseable output falls back", stubLLM{text: "sure! here is your roadmap"}, true, "Lộ trình chuẩn bị", "Xác định ngành"},
		{"empty tasks falls back", stubLLM{text: `{"summary":"hi","tasks":[]}`}, true, "Lộ trình chuẩn bị", "Xác định ngành"},
		{"no provider configured falls back", nil, true, "Lộ trình chuẩn bị", "Xác định ngành"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := NewAdmissionsCounselorAgent(tc.llmClient).generateRoadmap(ctx, ask, nil)
			if err != nil {
				t.Fatalf("generateRoadmap: %v", err)
			}
			if got.Degraded != tc.wantDegraded {
				t.Errorf("degraded = %v, want %v (reply: %q)", got.Degraded, tc.wantDegraded, got.Reply)
			}
			if !strings.Contains(got.Reply, tc.wantInReply) {
				t.Errorf("reply = %q, want it to contain %q", got.Reply, tc.wantInReply)
			}

			tasks, _ := got.ProposedActions[0].Payload["tasks"].([]map[string]any)
			if len(tasks) == 0 {
				t.Fatalf("no tasks in proposed action payload: %#v", got.ProposedActions[0].Payload)
			}
			if title, _ := tasks[0]["title"].(string); !strings.Contains(title, tc.wantTask) {
				t.Errorf("first task = %q, want it to contain %q", title, tc.wantTask)
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
