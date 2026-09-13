package handlers

import (
	"testing"

	"golang.org/x/text/unicode/norm"
)

const sampleSourceText = `Congratulations on your admission. Please submit your Statement of Purpose by 15/01/2027. Official transcripts must be received on a rolling basis.`

func TestBuildExtractedAction_VerifiedEvidenceAndParsableDate_HighConfidence(t *testing.T) {
	raw := rawExtractedAction{
		Title:        "Submit Statement of Purpose",
		Category:     "sop",
		RawDateText:  "15/01/2027",
		EvidenceSpan: "Please submit your Statement of Purpose by 15/01/2027",
		AIConfidence: 0.8,
	}

	got := buildExtractedAction(raw, sampleSourceText)

	if got.ParsedDate != "2027-01-15" {
		t.Errorf("ParsedDate = %q, want 2027-01-15", got.ParsedDate)
	}
	if got.DateAmbiguous {
		t.Error("15/01/2027 should not be ambiguous (day=15 forces day-first)")
	}
	if got.EvidenceVerified == nil || !*got.EvidenceVerified {
		t.Error("evidence span is verbatim in source text, EvidenceVerified should be true")
	}
	if got.Confidence <= raw.AIConfidence {
		t.Errorf("verified evidence should boost confidence above the model's own %v, got %v", raw.AIConfidence, got.Confidence)
	}
	if got.NeedsReview {
		t.Error("a high-confidence, verified item should not need review")
	}
}

func TestBuildExtractedAction_FabricatedEvidence_LowConfidenceAndFlagged(t *testing.T) {
	raw := rawExtractedAction{
		Title:        "Pay enrollment deposit",
		Category:     "financial_document",
		RawDateText:  "01/03/2027",
		EvidenceSpan: "A $500 non-refundable deposit secures your seat immediately upon acceptance.", // not in sampleSourceText at all
		AIConfidence: 0.9,
	}

	got := buildExtractedAction(raw, sampleSourceText)

	if got.EvidenceVerified == nil || *got.EvidenceVerified {
		t.Fatal("evidence span does not appear in the source text; EvidenceVerified must be false")
	}
	if got.Confidence >= raw.AIConfidence {
		t.Errorf("a fabricated citation must be penalized below the model's own confidence %v, got %v", raw.AIConfidence, got.Confidence)
	}
	if !got.NeedsReview {
		t.Error("a fabricated-evidence item must be flagged needs_review regardless of the model's stated confidence")
	}
}

func TestBuildExtractedAction_UnparsableDate_FlaggedNotSilentlyAccepted(t *testing.T) {
	raw := rawExtractedAction{
		Title:        "Submit application",
		Category:     "other",
		RawDateText:  "sometime in early 2027", // not a format parseFlexibleDate recognizes
		EvidenceSpan: "",
		AIConfidence: 0.9,
	}

	got := buildExtractedAction(raw, "")

	if got.ParsedDate != "" {
		t.Errorf("an unparsable date string must not produce a ParsedDate, got %q", got.ParsedDate)
	}
	if !got.NeedsReview {
		t.Error("an unparsable stated date must be flagged needs_review")
	}
	if got.Confidence >= raw.AIConfidence {
		t.Errorf("confidence must drop below the model's own %v when the date can't be verified, got %v", raw.AIConfidence, got.Confidence)
	}
}

func TestBuildExtractedAction_NoSourceText_EvidenceUncheckedNotFalse(t *testing.T) {
	// File-only extraction (e.g. a scanned image) has no plain-text source to
	// check evidence_span against. This must be represented as "unknown",
	// not silently treated as "verified" or "failed".
	raw := rawExtractedAction{
		Title:        "Rolling admission",
		Category:     "other",
		RawDateText:  "Rolling",
		EvidenceSpan: "Applications are reviewed on a rolling basis.",
		AIConfidence: 0.7,
	}

	got := buildExtractedAction(raw, "")

	if got.EvidenceVerified != nil {
		t.Errorf("with no source text, EvidenceVerified must be nil (unchecked), got %v", *got.EvidenceVerified)
	}
	if got.ParsedDate != "" {
		t.Error("'Rolling' is a policy phrase, not a date, and must not produce a ParsedDate")
	}
	if !got.NeedsReview {
		t.Error("'Rolling' has no calendar date to attach as a Kanban due date, so it must be flagged for the user to handle manually")
	}
}

func TestBuildExtractedAction_AmbiguousDate_ConfidenceDiscounted(t *testing.T) {
	unambiguous := buildExtractedAction(rawExtractedAction{
		RawDateText:  "25/01/2027", // day=25 forces an unambiguous reading
		AIConfidence: 0.8,
	}, "")
	ambiguous := buildExtractedAction(rawExtractedAction{
		RawDateText:  "03/04/2027", // both readings valid
		AIConfidence: 0.8,
	}, "")

	if !ambiguous.DateAmbiguous {
		t.Fatal("03/04/2027 should be flagged ambiguous")
	}
	if ambiguous.Confidence >= unambiguous.Confidence {
		t.Errorf("an ambiguous date must score lower confidence than an unambiguous one from the same starting AIConfidence: ambiguous=%v unambiguous=%v", ambiguous.Confidence, unambiguous.Confidence)
	}
}

// TestBuildExtractedAction_AmbiguousDate_AlwaysNeedsReview is the case a
// review found: a high enough starting AIConfidence could survive the 0.75x
// ambiguity discount and land above the 0.5 needs_review cutoff purely by
// arithmetic (0.9*0.75=0.675), silently presenting a day/month guess as
// certain. NeedsReview must be forced regardless of the resulting confidence
// value.
func TestBuildExtractedAction_AmbiguousDate_AlwaysNeedsReview(t *testing.T) {
	got := buildExtractedAction(rawExtractedAction{
		RawDateText:  "03/04/2027",
		AIConfidence: 0.9, // high enough that 0.9*0.75=0.675 would clear the 0.5 threshold
	}, "")

	if !got.DateAmbiguous {
		t.Fatal("03/04/2027 should be flagged ambiguous")
	}
	if got.Confidence < 0.5 {
		t.Fatalf("test setup invalid: expected confidence to clear 0.5 despite the discount, got %v", got.Confidence)
	}
	if !got.NeedsReview {
		t.Errorf("an ambiguous date must be flagged needs_review even when confidence (%v) is above the threshold — a guessed day/month must never look certain", got.Confidence)
	}
}

// TestContainsFold_MatchesAcrossUnicodeNormalizationForms covers a review
// finding specific to the product's primary Vietnamese market: a PDF's text
// layer and the LLM's echoed quote can encode the same visible diacritic as
// different byte sequences (precomposed vs. base letter + combining mark).
// A truly verbatim quote must still match regardless of which form either
// side happens to use.
func TestContainsFold_MatchesAcrossUnicodeNormalizationForms(t *testing.T) {
	precomposed := "Hạn nộp hồ sơ là ngày 15 tháng 1" // NFC: "ạ" as one code point
	decomposed := norm.NFD.String(precomposed)        // same text, "ạ" as a + combining marks

	if precomposed == decomposed {
		t.Fatal("test setup invalid: NFD form should differ byte-for-byte from the NFC source")
	}

	if !containsFold(precomposed, decomposed) {
		t.Error("containsFold should match a decomposed (NFD) needle against an NFC haystack")
	}
	if !containsFold(decomposed, precomposed) {
		t.Error("containsFold should match a precomposed (NFC) needle against an NFD haystack")
	}
}
