package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Tool struct {
	Name string
	Description string
	Execute func(ctx context.Context, args map[string]any) (ToolResult, error)
}

type ToolResult struct { Data any `json:"data"`; Source string `json:"source"` }

type UniversityProgram struct {
	ID string `json:"id"`; UniversityID string `json:"university_id"`; UniversityName string `json:"university_name"`; Name string `json:"name"`; Degree string `json:"degree"`; TuitionPerYear float64 `json:"tuition_per_year"`; Deadline string `json:"deadline"`; SourceURL string `json:"source_url"`; SourceLabel string `json:"source_label"`; LastVerifiedAt string `json:"last_verified_at"`
	University struct { Name string `json:"name"`; SourceURL string `json:"source_url"`; SourceLabel string `json:"source_label"`; LastVerifiedAt time.Time `json:"last_verified_at"` } `json:"university"`
}

func SearchUniversitiesTool() Tool {
	return Tool{Name: "search_universities", Description: "Search program records with official-source provenance.", Execute: func(ctx context.Context, args map[string]any) (ToolResult, error) {
		query, _ := args["query"].(string)
		baseURL := os.Getenv("UNIVERSITY_SERVICE_URL")
		if baseURL == "" { baseURL = "http://localhost:8004" }
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, strings.TrimRight(baseURL, "/")+"/api/v1/programs?q="+url.QueryEscape(query), nil)
		if err != nil { return ToolResult{}, err }
		client := &http.Client{Timeout: 8*time.Second}
		resp, err := client.Do(req)
		if err != nil { return ToolResult{}, err }
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK { body, _ := io.ReadAll(resp.Body); return ToolResult{}, fmt.Errorf("university service returned %d: %s", resp.StatusCode, string(body)) }
		var payload struct { Data []UniversityProgram `json:"data"` }
		if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil { return ToolResult{}, err }
		for i := range payload.Data { normalizeProgram(&payload.Data[i]) }
		return ToolResult{Data: payload.Data, Source: "university-service"}, nil
	}}
}

func normalizeProgram(program *UniversityProgram) {
	if program.UniversityName == "" { program.UniversityName = program.University.Name }
	if program.SourceURL == "" { program.SourceURL = program.University.SourceURL }
	if program.SourceLabel == "" { program.SourceLabel = program.University.SourceLabel }
	if program.LastVerifiedAt == "" && !program.University.LastVerifiedAt.IsZero() { program.LastVerifiedAt = program.University.LastVerifiedAt.Format(time.RFC3339) }
}

type roadmapData struct { Summary string `json:"summary"`; Tasks []map[string]any `json:"tasks"`; Nodes []InsightNode `json:"nodes"` }
func GenerateRoadmapTasksTool() Tool { return Tool{Name: "generate_roadmap_tasks", Description: "Generate a transparent, editable admissions preparation checklist.", Execute: func(_ context.Context, args map[string]any) (ToolResult, error) {
	year := time.Now().Year()+1
	if value, ok := args["target_year"].(float64); ok && value >= float64(time.Now().Year()) { year = int(value) }
	tasks := []map[string]any{{"title":"Xác định ngành, quốc gia và ngân sách", "phase":"Định hướng", "priority":"high"}, {"title":"Lập danh sách trường và kiểm tra nguồn chính thức", "phase":"Nghiên cứu", "priority":"high"}, {"title":"Chuẩn bị chứng chỉ ngoại ngữ", "phase":"Hồ sơ", "priority":"high"}, {"title":"Viết nháp SOP và xin thư giới thiệu", "phase":"Hồ sơ", "priority":"medium"}, {"title":"Rà soát từng deadline trước khi nộp", "phase":"Nộp hồ sơ", "priority":"high"}}
	return ToolResult{Source:"agent", Data: roadmapData{Summary:"Lộ trình chuẩn bị cho kỳ nhập học " + strconv.Itoa(year) + ". Bạn có thể chỉnh từng mốc theo trường và deadline thực tế.", Tasks:tasks, Nodes:[]InsightNode{{ID:"roadmap-goal", Label:"Lộ trình nhập học", Category:"Tầm nhìn tương lai", Description:"Một checklist có thể chỉnh sửa, bắt đầu từ mục tiêu và dữ liệu đã xác thực."}}}}, nil
} } }

func parsePrograms(data any) []UniversityProgram { programs, ok := data.([]UniversityProgram); if !ok { return nil }; return programs }
func parseRoadmap(data any) roadmapData { roadmap, ok := data.(roadmapData); if !ok { return roadmapData{} }; return roadmap }
func sourceLabel(program UniversityProgram) string { if program.SourceLabel != "" { return program.SourceLabel }; return program.UniversityName + " — nguồn chính thức" }
func uniqueCitations(citations []Citation) []Citation { seen := map[string]bool{}; result := make([]Citation, 0, len(citations)); for _, citation := range citations { if citation.URL != "" && !seen[citation.URL] { seen[citation.URL] = true; result = append(result, citation) } }; return result }
