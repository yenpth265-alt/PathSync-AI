package handlers

import "testing"

func TestPercentile(t *testing.T) {
	values := []int64{100, 200, 300, 400, 500, 600, 700, 800, 900, 1000}

	cases := []struct {
		p    int
		want int64
	}{
		{50, 500},
		{95, 1000},
		{100, 1000},
	}
	for _, tc := range cases {
		if got := percentile(values, tc.p); got != tc.want {
			t.Errorf("percentile(values, %d) = %d, want %d", tc.p, got, tc.want)
		}
	}
}

func TestPercentile_EmptyIsZero(t *testing.T) {
	if got := percentile(nil, 50); got != 0 {
		t.Errorf("percentile(nil, 50) = %d, want 0", got)
	}
}

func TestPercentile_DoesNotMutateInput(t *testing.T) {
	values := []int64{500, 100, 300}
	_ = percentile(values, 50)
	if values[0] != 500 || values[1] != 100 || values[2] != 300 {
		t.Errorf("percentile mutated its input slice: %v", values)
	}
}

func TestAverage(t *testing.T) {
	if got := average([]int64{100, 200, 300}); got != 200 {
		t.Errorf("average = %d, want 200", got)
	}
	if got := average(nil); got != 0 {
		t.Errorf("average(nil) = %d, want 0", got)
	}
}
