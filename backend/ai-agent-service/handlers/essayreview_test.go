package handlers

import (
	"strings"
	"testing"
)

func newTestEssayReviewResponse() EssayReviewResponse {
	return EssayReviewResponse{
		Feedback: "Solid draft overall, focus on making the middle section more concrete.",
		Rubric: []RubricScore{
			{Dimension: "specificity", Level: "developing", EvidenceSpan: "I learned a lot from this experience", Advice: "Name the specific skill you gained instead of 'a lot'."},
		},
		Issues: []map[string]interface{}{
			{"type": "cliche", "description": "generic phrase", "suggestion": "Replace with a concrete detail."},
		},
	}
}

func TestEnforceEssayReviewGuardrail_LegitimateFeedbackPasses(t *testing.T) {
	result := newTestEssayReviewResponse()

	intervened := enforceEssayReviewGuardrail(&result)

	if intervened {
		t.Fatal("guardrail fired on short, legitimate feedback")
	}
	if len(result.Rubric) != 1 || len(result.Issues) != 1 {
		t.Fatalf("expected rubric/issues to survive untouched, got rubric=%d issues=%d", len(result.Rubric), len(result.Issues))
	}
}

func TestEnforceEssayReviewGuardrail_RefusesLongFeedback(t *testing.T) {
	result := newTestEssayReviewResponse()
	result.Feedback = strings.Repeat("word ", maxFeedbackWords+20)

	intervened := enforceEssayReviewGuardrail(&result)

	if !intervened {
		t.Fatal("guardrail did not fire on essay-length feedback")
	}
	if strings.Contains(result.Feedback, "word word") {
		t.Errorf("long feedback leaked through: %q", result.Feedback)
	}
}

func TestEnforceEssayReviewGuardrail_ReplacesOversizedAdvice(t *testing.T) {
	result := newTestEssayReviewResponse()
	result.Rubric[0].Advice = strings.Repeat("word ", maxAdviceWords+20)

	intervened := enforceEssayReviewGuardrail(&result)

	if !intervened {
		t.Fatal("guardrail did not fire on an oversized advice field")
	}
	if strings.Contains(result.Rubric[0].Advice, "word word") {
		t.Errorf("long advice text leaked through: %q", result.Rubric[0].Advice)
	}
	if len(result.Rubric) != 1 {
		t.Errorf("expected the rubric dimension to survive (with replaced text), got %d entries", len(result.Rubric))
	}
}

func TestEnforceEssayReviewGuardrail_DropsOversizedIssueSuggestion(t *testing.T) {
	result := newTestEssayReviewResponse()
	result.Issues = append(result.Issues, map[string]interface{}{
		"type": "structure", "description": "weak conclusion", "suggestion": strings.Repeat("word ", maxIssueSuggestionWords+20),
	})

	intervened := enforceEssayReviewGuardrail(&result)

	if !intervened {
		t.Fatal("guardrail did not fire on an oversized issue suggestion")
	}
	if len(result.Issues) != 1 {
		t.Fatalf("expected only the oversized issue to be dropped, got %d remaining", len(result.Issues))
	}
}

// TestEnforceEssayReviewGuardrail_RefusesChunkedRewrite is the exact bypass a
// review found (and this guardrail was written after fixing) in SOPAssist:
// splitting a full rewrite across many individually-short fields to dodge a
// per-field-only word cap. Four rubric dimensions at 55 words each = 220
// words, each individually under the 60-word cap.
func TestEnforceEssayReviewGuardrail_RefusesChunkedRewrite(t *testing.T) {
	chunk := strings.Repeat("word ", maxAdviceWords-5)
	result := EssayReviewResponse{
		Feedback: "Fine.",
		Rubric: []RubricScore{
			{Dimension: "theme", Advice: chunk},
			{Dimension: "specificity", Advice: chunk},
			{Dimension: "structure", Advice: chunk},
			{Dimension: "clarity", Advice: chunk},
		},
	}

	intervened := enforceEssayReviewGuardrail(&result)

	if !intervened {
		t.Fatal("guardrail did not fire on a rewrite chunked across 4 rubric dimensions")
	}

	totalWords := 0
	for _, r := range result.Rubric {
		if r.Advice == chunk {
			totalWords += len(strings.Fields(r.Advice))
		}
	}
	if totalWords > maxTotalRewriteWords {
		t.Errorf("combined surviving advice word count %d exceeds the %d-word budget", totalWords, maxTotalRewriteWords)
	}
}
