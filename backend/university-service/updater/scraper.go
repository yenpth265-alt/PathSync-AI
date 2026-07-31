package updater

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"time"

	"university-service/database"
	"university-service/models"

	"github.com/google/uuid"
)

type ScrapedProgram struct {
	Name           string  `json:"name"`
	Degree         string  `json:"degree"`
	TuitionPerYear float64 `json:"tuitionPerYear"`
	MinGPA         float64 `json:"minGPA"`
	MinIELTS       float64 `json:"minIELTS"`
	SourceURL      string  `json:"sourceURL"`
}

// ExtractTextFromHTML is a naive HTML tag stripper to reduce token size
func ExtractTextFromHTML(html string) string {
	re := regexp.MustCompile(`<script.*?>.*?</script>|<style.*?>.*?</style>|<[^>]*>`)
	return re.ReplaceAllString(html, " ")
}

func ScrapeUniversityWebsite(webURL string, uniID string) {
	log.Printf("[AI Scraper] Initiating scrape for %s...\n", webURL)

	// 1. Fetch the webpage content
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(webURL)
	if err != nil {
		log.Printf("[AI Scraper] Failed to fetch %s: %v\n", webURL, err)
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	rawHTML := string(bodyBytes)

	// Truncate if too large to save bandwidth (e.g., max 100KB of text)
	text := ExtractTextFromHTML(rawHTML)
	if len(text) > 100000 {
		text = text[:100000]
	}

	// 2. Call Gemini AI API
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Printf("[AI Scraper] GEMINI_API_KEY is missing! Skipping AI Scrape for %s\n", webURL)
		return
	}

	prompt := `You are an expert university admissions scraper.
I will provide text content extracted from an official university page.
Your task is to identify only facts that are explicitly stated in the text.
Do not invent program names, tuition, degrees, or admission requirements.
If the page does not contain a clear program record, return an empty JSON array.

Return ONLY a valid JSON array of objects with these exact keys:
name (string), degree (string: bachelor/master/phd/other), tuitionPerYear (number), minGPA (number), minIELTS (number), sourceURL (string).
Do NOT wrap the JSON in markdown code blocks. Output raw JSON only.

Website Content:
` + text

	reqBody := GeminiRequest{
		Contents: []Content{
			{Parts: []Part{{Text: prompt}}},
		},
	}

	jsonData, _ := json.Marshal(reqBody)
	geminiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", apiKey)

	aiResp, err := http.Post(geminiURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("[AI Scraper] Failed to call Gemini API: %v\n", err)
		return
	}
	defer aiResp.Body.Close()

	var gResp GeminiResponse
	if err := json.NewDecoder(aiResp.Body).Decode(&gResp); err != nil || len(gResp.Candidates) == 0 {
		log.Printf("[AI Scraper] Invalid response from Gemini: %v\n", err)
		return
	}

	aiText := gResp.Candidates[0].Content.Parts[0].Text

	// 3. Parse JSON and insert into DB
	var programs []ScrapedProgram
	if err := json.Unmarshal([]byte(aiText), &programs); err != nil {
		log.Printf("[AI Scraper] Failed to parse AI JSON output: %v\nOutput was: %s\n", err, aiText)
		return
	}

	for _, p := range programs {
		dbProg := models.Program{
			ID:             uuid.NewString(),
			UniversityID:   uniID,
			Name:           p.Name,
			Degree:         p.Degree,
			TuitionPerYear: p.TuitionPerYear,
			MinGPA:         p.MinGPA,
			MinIELTS:       p.MinIELTS,
			ProgramURL:     p.SourceURL,
			SourceURL:      webURL,
			SourceLabel:    "Official source",
			LastVerifiedAt: time.Now(),
			CreatedAt:      time.Now(),
		}
		database.DB.Create(&dbProg)
		log.Printf("[AI Scraper] Successfully extracted and saved program: %s\n", p.Name)
	}
}
