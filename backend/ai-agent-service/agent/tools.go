package agent

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

type Tool struct {
	Name        string                                         `json:"name"`
	Description string                                         `json:"description"`
	Execute     func(args map[string]interface{}) (string, error) `json:"-"`
}

type UniversityProgram struct {
	ID             string  `json:"id"`
	UniversityName string  `json:"university_name"`
	Name           string  `json:"name"`
	Degree         string  `json:"degree"`
	TuitionPerYear float64 `json:"tuition_per_year"`
	MinGPA         float64 `json:"min_gpa"`
	MinIELTS       float64 `json:"min_ielts"`
}

// Tool 1: Search Real Universities in DB
func SearchUniversitiesTool() Tool {
	return Tool{
		Name:        "search_universities",
		Description: "Search real university programs from the system database by degree, max tuition budget, or country.",
		Execute: func(args map[string]interface{}) (string, error) {
			query := ""
			if q, ok := args["query"].(string); ok {
				query = q
			}

			apiURL := fmt.Sprintf("http://localhost:8004/api/v1/programs?q=%s", url.QueryEscape(query))
			client := &http.Client{Timeout: 5 * time.Second}
			resp, err := client.Get(apiURL)
			if err != nil {
				// Fallback attempt to API gateway
				resp, err = client.Get(fmt.Sprintf("http://localhost:8000/api/v1/programs?q=%s", url.QueryEscape(query)))
				if err != nil {
					return "Failed to query University Service", err
				}
			}
			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				return "", err
			}

			var programs []UniversityProgram
			var wrapped struct {
				Data []UniversityProgram `json:"data"`
			}
			if err := json.Unmarshal(body, &wrapped); err == nil && len(wrapped.Data) > 0 {
				programs = wrapped.Data
			} else {
				var direct []UniversityProgram
				if err := json.Unmarshal(body, &direct); err == nil {
					programs = direct
				} else {
					return string(body), nil
				}
			}

			if len(programs) == 0 {
				return "No matching university programs found in database.", nil
			}

			limit := 10
			if len(programs) < limit {
				limit = len(programs)
			}

			var resultSummary string
			for i := 0; i < limit; i++ {
				p := programs[i]
				uniName := p.UniversityName
				if uniName == "" && p.Name != "" {
					uniName = p.Name
				}
				resultSummary += fmt.Sprintf("- %s: Program '%s' (%s), Tuition: $%.0f/yr, Min GPA: %.1f, Min IELTS: %.1f\n",
					uniName, p.Name, p.Degree, p.TuitionPerYear, p.MinGPA, p.MinIELTS)
			}

			return resultSummary, nil
		},
	}
}

// Tool 2: Generate Roadmap Tasks
func GenerateRoadmapTasksTool() Tool {
	return Tool{
		Name:        "generate_roadmap_tasks",
		Description: "Generate a timeline of milestones and action items for study abroad preparation.",
		Execute: func(args map[string]interface{}) (string, error) {
			targetYear := 2025
			if y, ok := args["target_year"].(float64); ok {
				targetYear = int(y)
			}

			roadmap := fmt.Sprintf(`Timeline Milestones for Fall %d Admissions:
- Month 1-2: Standardized Test Prep (IELTS 7.0+, GRE/GMAT if applicable)
- Month 3-4: Build Persona & Extracurricular Highlights (Persona Lab)
- Month 5-6: Draft Statement of Purpose (SOP) & Secure Recommendation Letters
- Month 7-8: Finalize Application Submission & Apply for Scholarships
- Month 9-10: Visa Interview & Departure Readiness`, targetYear)

			return roadmap, nil
		},
	}
}
