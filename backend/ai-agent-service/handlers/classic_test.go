package handlers

import (
	"strings"
	"testing"
)

// TestEnforceSOPGuardrail_ShortSuggestionPasses verifies a genuinely short,
// editorial suggestion is left untouched — the guardrail must not fire on
// legitimate assistance.
func TestEnforceSOPGuardrail_ShortSuggestionPasses(t *testing.T) {
	result := &SOPAssistResponse{
		Suggestion: "Consider naming the specific research methodology you used, not just 'I did research'.",
		Improvements: []map[string]interface{}{
			{"type": "cliche", "original": "passionate about", "suggested": "drawn to"},
		},
	}

	intervened := enforceSOPGuardrail(result)

	if intervened {
		t.Fatalf("guardrail fired on a short suggestion: %q", result.Suggestion)
	}
	if len(result.Improvements) != 1 {
		t.Fatalf("expected the single short improvement to survive, got %d", len(result.Improvements))
	}
}

// TestEnforceSOPGuardrail_RefusesFullEssay is the case the pitch's claim ("the
// product does not write the student's essay") depends on: if the model
// ignores the prompt instruction and returns essay-length prose anyway, this
// must catch it — prompt text alone is not trusted to hold.
func TestEnforceSOPGuardrail_RefusesFullEssay(t *testing.T) {
	fullEssay := strings.Repeat("word ", maxSuggestionWords+50)
	result := &SOPAssistResponse{
		Suggestion: fullEssay,
		Improvements: []map[string]interface{}{
			{"type": "cliche", "original": "x", "suggested": "y"},
		},
	}

	intervened := enforceSOPGuardrail(result)

	if !intervened {
		t.Fatalf("guardrail did not fire on a %d-word suggestion", maxSuggestionWords+50)
	}
	if strings.Contains(result.Suggestion, "word word") {
		t.Fatalf("full essay text leaked through into the response: %q", result.Suggestion)
	}
	if len(result.Improvements) != 0 {
		t.Fatalf("expected improvements to be cleared alongside a full-essay refusal, got %d", len(result.Improvements))
	}
}

// TestEnforceSOPGuardrail_DropsOversizedReplacement covers the other bypass:
// a short top-level "suggestion" hiding a paragraph-length ghostwritten
// replacement inside "improvements[].suggested".
func TestEnforceSOPGuardrail_DropsOversizedReplacement(t *testing.T) {
	longReplacement := strings.Repeat("word ", maxSingleReplacementWords+20)
	result := &SOPAssistResponse{
		Suggestion: "Here is a phrase-level fix.",
		Improvements: []map[string]interface{}{
			{"type": "cliche", "original": "short phrase", "suggested": longReplacement},
			{"type": "cliche", "original": "another phrase", "suggested": "a fine short swap"},
		},
	}

	intervened := enforceSOPGuardrail(result)

	if !intervened {
		t.Fatalf("guardrail did not fire on a %d-word replacement", maxSingleReplacementWords+20)
	}
	if len(result.Improvements) != 1 {
		t.Fatalf("expected only the oversized replacement to be dropped, got %d remaining", len(result.Improvements))
	}
	if result.Improvements[0]["original"] != "another phrase" {
		t.Fatalf("the surviving replacement should be the short one, got %v", result.Improvements[0])
	}
}

// TestEnforceSOPGuardrail_RefusesChunkedFullEssay is the exact bypass a
// review found in the first version of this guardrail: a model can dodge a
// per-item word cap by splitting a full essay across many entries that are
// each individually short. The combined-word-budget check must still catch it.
func TestEnforceSOPGuardrail_RefusesChunkedFullEssay(t *testing.T) {
	chunk := strings.Repeat("word ", maxSingleReplacementWords-5) // under the per-item cap alone
	improvements := make([]map[string]interface{}, 0, 15)
	for i := 0; i < 15; i++ {
		improvements = append(improvements, map[string]interface{}{
			"type": "cliche", "original": "x", "suggested": chunk,
		})
	}
	result := &SOPAssistResponse{
		Suggestion:   "Here is a phrase-level fix.",
		Improvements: improvements,
	}

	intervened := enforceSOPGuardrail(result)

	if !intervened {
		t.Fatal("guardrail did not fire on 15 chunked items that together total a full essay")
	}

	totalWords := 0
	for _, imp := range result.Improvements {
		totalWords += len(strings.Fields(imp["suggested"].(string)))
	}
	if totalWords > maxTotalReplacementWords {
		t.Fatalf("combined replacement word count %d exceeds the %d-word budget", totalWords, maxTotalReplacementWords)
	}
}

// TestEnforceSOPGuardrail_CapsImprovementItemCount guards the other half of
// the same bypass class: a very large number of tiny replacements that would
// individually and even cumulatively (if each were near-zero words) fit
// under the word budget, but which no longer resemble "editing suggestions."
func TestEnforceSOPGuardrail_CapsImprovementItemCount(t *testing.T) {
	improvements := make([]map[string]interface{}, 0, maxImprovementItems+5)
	for i := 0; i < maxImprovementItems+5; i++ {
		improvements = append(improvements, map[string]interface{}{
			"type": "cliche", "original": "x", "suggested": "y",
		})
	}
	result := &SOPAssistResponse{Suggestion: "Fine.", Improvements: improvements}

	intervened := enforceSOPGuardrail(result)

	if !intervened {
		t.Fatal("guardrail did not fire on an improvement list exceeding maxImprovementItems")
	}
	if len(result.Improvements) > maxImprovementItems {
		t.Fatalf("expected at most %d improvements, got %d", maxImprovementItems, len(result.Improvements))
	}
}
