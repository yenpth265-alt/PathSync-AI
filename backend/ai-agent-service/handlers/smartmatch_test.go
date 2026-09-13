package handlers

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"pathsync-ai-agent-service/agent"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func runFallbackMatch(input SmartMatchInput, programs []agent.UniversityProgram, overBudget int) SmartMatchResponse {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	fallbackMatch(c, input, programs, overBudget)

	var result SmartMatchResponse
	json.Unmarshal(w.Body.Bytes(), &result)
	return result
}

// TestFallbackMatch_BudgetIsAHardFilterNotAScoreWeight documents the design a
// review pushed toward: fallbackMatch never re-applies budget as part of the
// 0-100 score (which would conflate "affordable" with "academically
// competitive"). It only ever sees programs SmartMatch has already filtered
// by budget, and surfaces that as a reason line rather than silently.
func TestFallbackMatch_BudgetIsAHardFilterNotAScoreWeight(t *testing.T) {
	input := SmartMatchInput{GPA: 3.8, IELTS: 7.0, Budget: 30000}
	programs := []agent.UniversityProgram{
		{ID: "p1", UniversityName: "Affordable U", Name: "MSc CS", MinGPA: 3.0, TuitionPerYear: 25000},
	}

	result := runFallbackMatch(input, programs, 0)

	all := append(append(result.Reach, result.Target...), result.Safe...)
	if len(all) != 1 {
		t.Fatalf("expected 1 ranked program, got %d", len(all))
	}
	reasons, _ := all[0]["reasons"].([]interface{})
	found := false
	for _, r := range reasons {
		if s, ok := r.(string); ok && s == "Trong ngân sách $30000/năm (học phí: $25000/năm)" {
			found = true
		}
	}
	if !found {
		t.Errorf("expected a budget reason line, got %v", reasons)
	}
}

// TestFallbackMatch_NoBudgetSetOmitsReason ensures the reason line doesn't
// show up when the user never gave a budget — Budget<=0 means "not set", not
// "free."
func TestFallbackMatch_NoBudgetSetOmitsReason(t *testing.T) {
	input := SmartMatchInput{GPA: 3.8, IELTS: 7.0, Budget: 0}
	programs := []agent.UniversityProgram{
		{ID: "p1", UniversityName: "Some U", Name: "MSc CS", MinGPA: 3.0, TuitionPerYear: 25000},
	}

	result := runFallbackMatch(input, programs, 0)
	all := append(append(result.Reach, result.Target...), result.Safe...)
	reasons, _ := all[0]["reasons"].([]interface{})
	for _, r := range reasons {
		if s, ok := r.(string); ok && s == "Trong ngân sách $0/năm (học phí: $25000/năm)" {
			t.Errorf("should not show a budget reason when the user set no budget, got %v", reasons)
		}
	}
}

// TestFallbackMatch_OverBudgetCountSurfacedInNotice verifies the user is told
// when results were filtered for affordability, rather than silently seeing
// fewer programs with no explanation.
func TestFallbackMatch_OverBudgetCountSurfacedInNotice(t *testing.T) {
	result := runFallbackMatch(SmartMatchInput{GPA: 3.8, Budget: 10000}, nil, 3)

	if result.SafetyNotice == "" {
		t.Fatal("expected a safety notice")
	}
	if !strings.Contains(result.SafetyNotice, "3 chương trình") {
		t.Errorf("expected the notice to mention the 3 filtered programs, got %q", result.SafetyNotice)
	}
}
