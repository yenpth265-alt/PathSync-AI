package handlers

import (
	"math"
	"net/http"
	"sort"

	"github.com/gin-gonic/gin"
	"pathsync-ai-agent-service/database"
)

// ExtractionMetricsSummary answers, from real recorded calls, the question a
// marketing claim like "trung bình 3,2 giây/tệp" should have been answering
// all along. p50/p95 matter more than the mean here: a handful of slow
// scanned-image calls can drag a mean up without reflecting the typical
// wait, which is what a user actually feels.
type ExtractionMetricsSummary struct {
	SampleSize   int64                     `json:"sample_size"`
	SuccessRate  float64                   `json:"success_rate"`
	AvgLatencyMS int64                     `json:"avg_latency_ms"`
	P50LatencyMS int64                     `json:"p50_latency_ms"`
	P95LatencyMS int64                     `json:"p95_latency_ms"`
	ByInputKind  map[string]InputKindStats `json:"by_input_kind"`
}

type InputKindStats struct {
	SampleSize   int64 `json:"sample_size"`
	AvgLatencyMS int64 `json:"avg_latency_ms"`
	P50LatencyMS int64 `json:"p50_latency_ms"`
	P95LatencyMS int64 `json:"p95_latency_ms"`
}

// GetExtractionMetrics is admin-only (see routes.go: RequireAdmin) — these
// are operational numbers about API cost and latency, not something every
// signed-in user needs to see.
func GetExtractionMetrics(c *gin.Context) {
	if database.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not configured"})
		return
	}

	var rows []database.ExtractionMetric
	if err := database.DB.Order("created_at desc").Limit(5000).Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load extraction metrics"})
		return
	}

	if len(rows) == 0 {
		c.JSON(http.StatusOK, ExtractionMetricsSummary{ByInputKind: map[string]InputKindStats{}})
		return
	}

	successCount := 0
	allLatencies := make([]int64, 0, len(rows))
	byKind := map[string][]int64{}

	for _, r := range rows {
		if r.Success {
			successCount++
			allLatencies = append(allLatencies, r.LatencyMS)
			byKind[r.InputKind] = append(byKind[r.InputKind], r.LatencyMS)
		}
	}

	summary := ExtractionMetricsSummary{
		SampleSize:   int64(len(rows)),
		SuccessRate:  float64(successCount) / float64(len(rows)),
		AvgLatencyMS: average(allLatencies),
		P50LatencyMS: percentile(allLatencies, 50),
		P95LatencyMS: percentile(allLatencies, 95),
		ByInputKind:  map[string]InputKindStats{},
	}

	for kind, latencies := range byKind {
		summary.ByInputKind[kind] = InputKindStats{
			SampleSize:   int64(len(latencies)),
			AvgLatencyMS: average(latencies),
			P50LatencyMS: percentile(latencies, 50),
			P95LatencyMS: percentile(latencies, 95),
		}
	}

	c.JSON(http.StatusOK, summary)
}

func average(values []int64) int64 {
	if len(values) == 0 {
		return 0
	}
	var sum int64
	for _, v := range values {
		sum += v
	}
	return sum / int64(len(values))
}

// percentile uses the nearest-rank method on a sorted copy of values — simple
// and adequate for the sample sizes this endpoint will see; no interpolation
// library needed for that.
func percentile(values []int64, p int) int64 {
	if len(values) == 0 {
		return 0
	}
	sorted := append([]int64(nil), values...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i] < sorted[j] })

	rank := int(math.Ceil(float64(p)/100.0*float64(len(sorted)))) - 1
	if rank < 0 {
		rank = 0
	}
	if rank >= len(sorted) {
		rank = len(sorted) - 1
	}
	return sorted[rank]
}
