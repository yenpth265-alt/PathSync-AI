package handlers

import (
	"testing"
	"time"
)

func TestParseFlexibleDate_UnambiguousFormats(t *testing.T) {
	cases := []struct {
		name string
		raw  string
		want string // "2006-01-02"
	}{
		{"ISO", "2027-01-15", "2027-01-15"},
		{"ISO single-digit", "2027-1-5", "2027-01-05"},
		{"day-first with day > 12", "25/01/2027", "2027-01-25"},
		{"month-first forced by day > 12", "01/25/2027", "2027-01-25"},
		{"dash separated", "15-01-2027", "2027-01-15"},
		{"full English month", "January 15, 2027", "2027-01-15"},
		{"abbreviated English month", "Jan 15, 2027", "2027-01-15"},
		{"day then month name", "15 January 2027", "2027-01-15"},
		{"day then abbreviated month", "15 Jan 2027", "2027-01-15"},
		{"vietnamese with ngày", "ngày 15 tháng 1 năm 2027", "2027-01-15"},
		{"vietnamese without ngày", "15 tháng 1 năm 2027", "2027-01-15"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := parseFlexibleDate(tc.raw)
			if !ok {
				t.Fatalf("parseFlexibleDate(%q) failed to parse, want %s", tc.raw, tc.want)
			}
			if got.Ambiguous {
				t.Errorf("parseFlexibleDate(%q) marked Ambiguous, want unambiguous", tc.raw)
			}
			want, _ := time.Parse("2006-01-02", tc.want)
			if !got.Time.Equal(want) {
				t.Errorf("parseFlexibleDate(%q) = %s, want %s", tc.raw, got.Time.Format("2006-01-02"), tc.want)
			}
		})
	}
}

func TestParseFlexibleDate_AmbiguousNumericDefaultsToDayFirst(t *testing.T) {
	// Both 03 and 04 are valid months, so this is genuinely ambiguous. The
	// product defaults to Vietnamese day-first convention but must say so.
	got, ok := parseFlexibleDate("03/04/2027")
	if !ok {
		t.Fatal("expected 03/04/2027 to parse (ambiguous but resolvable)")
	}
	if !got.Ambiguous {
		t.Error("expected 03/04/2027 to be flagged Ambiguous")
	}
	want, _ := time.Parse("2006-01-02", "2027-04-03") // day=3, month=4
	if !got.Time.Equal(want) {
		t.Errorf("got %s, want %s (day-first convention)", got.Time.Format("2006-01-02"), "2027-04-03")
	}
}

func TestParseFlexibleDate_RefusesRatherThanGuesses(t *testing.T) {
	cases := []string{
		"",
		"   ",
		"Rolling",
		"rolling admission",
		"TBD",
		"N/A",
		"Chưa xác định",
		"15 tháng 1",       // no year stated — must not assume current/next year
		"tháng 1 năm 2027", // no day stated
		"13/13/2027",       // neither reading is a valid month
		"32/01/2027",       // no valid day
		"30/02/2027",       // Feb 30 does not exist
		"sometime next year",
		"see website",
	}

	for _, raw := range cases {
		t.Run(raw, func(t *testing.T) {
			if _, ok := parseFlexibleDate(raw); ok {
				t.Errorf("parseFlexibleDate(%q) should have refused to guess, but returned ok=true", raw)
			}
		})
	}
}

func TestParseFlexibleDate_RejectsImpossibleCalendarDates(t *testing.T) {
	if _, ok := parseFlexibleDate("2027-02-30"); ok {
		t.Error("2027-02-30 does not exist and must not silently roll over to March")
	}
}
