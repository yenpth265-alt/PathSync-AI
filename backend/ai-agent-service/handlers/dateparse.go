package handlers

import (
	"regexp"
	"strconv"
	"strings"
	"time"
)

// ParsedDate is the result of turning a deadline string extracted from a
// document into a real calendar date. This whole file is deterministic Go
// code — no LLM call happens here. See actions.go: the model is instructed
// to copy the deadline text verbatim (RawDateText) and never compute or
// reformat a date itself; parseFlexibleDate is what actually does the
// computation, and it always produces the same output for the same input.
type ParsedDate struct {
	Time time.Time
	// Ambiguous is true when a numeric date like "03/04/2027" could be read
	// either day-first or month-first and both readings are valid calendar
	// dates. It is resolved using the Vietnamese day-first convention, but
	// the caller should treat an ambiguous result with less confidence than
	// an unambiguous one instead of presenting a silent guess as certain.
	Ambiguous bool
}

var (
	isoDateRe     = regexp.MustCompile(`^(\d{4})-(\d{1,2})-(\d{1,2})$`)
	numericDateRe = regexp.MustCompile(`^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$`)
	// Matches "ngày 15 tháng 1 năm 2027", "15 tháng 1 năm 2027", or
	// "15 tháng 1" (year group empty — treated as unparseable, see below).
	vietnameseDateRe = regexp.MustCompile(`(?i)^(?:ngày\s*)?(\d{1,2})\s*th[aá]ng\s*(\d{1,2})(?:\s*năm\s*(\d{4}))?$`)
)

var monthNameLayouts = []string{
	"January 2, 2006",
	"Jan 2, 2006",
	"January 2 2006",
	"2 January 2006",
	"2 Jan 2006",
}

// nonDatePhrases name an admissions policy rather than a calendar date. They
// are legitimate extraction results — the LLM should still surface them as
// an action item — but turning them into a due_date would be fabrication,
// not parsing, so they deliberately fail here and get flagged for review
// instead.
var nonDatePhrases = map[string]bool{
	"rolling": true, "rolling admission": true, "rolling basis": true,
	"tbd": true, "n/a": true, "not specified": true, "none": true,
	"chưa xác định": true, "chưa có": true, "liên tục": true, "cuốn chiếu": true,
}

// parseFlexibleDate recognizes ISO dates, numeric D/M/Y or M/D/Y dates,
// English month names, and the Vietnamese "ngày D tháng M năm Y"
// construction. Anything it doesn't recognize — including a policy phrase
// like "rolling" or a date missing its year — returns ok=false rather than
// guessing, because a wrong guessed deadline is worse than an honest
// "needs review".
func parseFlexibleDate(raw string) (ParsedDate, bool) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return ParsedDate{}, false
	}
	if nonDatePhrases[strings.ToLower(trimmed)] {
		return ParsedDate{}, false
	}

	if m := isoDateRe.FindStringSubmatch(trimmed); m != nil {
		return buildDate(atoi(m[1]), atoi(m[2]), atoi(m[3]))
	}

	if m := numericDateRe.FindStringSubmatch(trimmed); m != nil {
		return resolveNumericDate(atoi(m[1]), atoi(m[2]), atoi(m[3]))
	}

	if m := vietnameseDateRe.FindStringSubmatch(trimmed); m != nil {
		if m[3] == "" {
			return ParsedDate{}, false // no year stated — do not assume one
		}
		return buildDate(atoi(m[3]), atoi(m[2]), atoi(m[1]))
	}

	for _, layout := range monthNameLayouts {
		if t, err := time.Parse(layout, trimmed); err == nil {
			return ParsedDate{Time: t}, true
		}
	}

	return ParsedDate{}, false
}

// resolveNumericDate takes the three numeric components of a D/M/Y-or-M/D/Y
// date. When one component is over 12 the reading is forced (it cannot be a
// month), so that case is reported unambiguous; when both are <=12, either
// reading is grammatically valid and this defaults to day-first — PathSync's
// primary market writes dates that way — while reporting Ambiguous so the
// caller can discount its confidence accordingly.
func resolveNumericDate(a, b, year int) (ParsedDate, bool) {
	switch {
	case a > 12 && b <= 12:
		return buildDate(year, b, a) // a can't be a month: a=day, b=month
	case b > 12 && a <= 12:
		return buildDate(year, a, b) // b can't be a month: a=month, b=day
	case a <= 12 && b <= 12:
		pd, ok := buildDate(year, b, a) // assume day-first; genuinely ambiguous
		pd.Ambiguous = ok
		return pd, ok
	default:
		return ParsedDate{}, false // neither reading is a valid month
	}
}

func buildDate(year, month, day int) (ParsedDate, bool) {
	if year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31 {
		return ParsedDate{}, false
	}
	t := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
	if t.Year() != year || int(t.Month()) != month || t.Day() != day {
		return ParsedDate{}, false // time.Date silently normalizes e.g. Feb 30 -> Mar 2
	}
	return ParsedDate{Time: t}, true
}

func atoi(s string) int {
	n, _ := strconv.Atoi(s)
	return n
}
