package updater

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"university-service/database"
	"university-service/models"
)



type OpenAIRequest struct {
	Model    string          `json:"model"`
	Messages []OpenAIMessage `json:"messages"`
	Temperature float32      `json:"temperature"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type CrawledPage struct {
	URL   string
	Title string
	Text  string
}

type ExtractedProgram struct {
	Name            string  `json:"name"`
	Degree          string  `json:"degree"`
	Duration        string  `json:"duration"`
	Language        string  `json:"language"`
	TuitionPerYear  float64 `json:"tuition_per_year"`
	ApplicationFee  float64 `json:"application_fee"`
	MinGPA          float64 `json:"min_gpa"`
	MinIELTS        float64 `json:"min_ielts"`
	MinTOEFL        int     `json:"min_toefl"`
	WorkExpRequired int     `json:"work_exp_required"`
	Deadline        string  `json:"deadline"`
	Fields          string  `json:"fields"`
	ProgramURL      string  `json:"program_url"`
	SourceURL       string  `json:"source_url"`
	SourceLabel     string  `json:"source_label"`
}

type ExtractedScholarship struct {
	Name                  string  `json:"name"`
	Coverage              string  `json:"coverage"`
	AmountPerYear         float64 `json:"amount_per_year"`
	EligibleDegrees       string  `json:"eligible_degrees"`
	EligibleFields        string  `json:"eligible_fields"`
	EligibleNationalities string  `json:"eligible_nationalities"`
	Deadline              string  `json:"deadline"`
	Requirements          string  `json:"requirements"`
	ScholarshipURL        string  `json:"scholarship_url"`
	SourceURL             string  `json:"source_url"`
	SourceLabel           string  `json:"source_label"`
}

func StartRealtimeUpdater() {
	go func() {
		log.Println("[Updater] Starting initial official source sync...")
		syncUniversitiesData()
	}()

	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for range ticker.C {
			log.Println("[Updater] Running scheduled official source sync...")
			syncUniversitiesData()
		}
	}()
}

func syncUniversitiesData() {
	sources := LoadOfficialSources()
	if len(sources) == 0 {
		log.Println("[Updater] No official sources configured; skipping sync.")
		return
	}

	for _, source := range sources {
		if len(source.SeedURLs) == 0 {
			continue
		}

		for _, seedURL := range source.SeedURLs {
			log.Printf("[Updater] Crawling official seed %s\n", seedURL)
			for _, page := range crawlOfficialPages(seedURL, 12) {
				upsertUniversityFromPage(source, page)
				extractAndStoreFromPage(source, page)
			}
		}
	}

	log.Println("[Updater] Official source sync completed.")
}

func crawlOfficialPages(seedURL string, maxPages int) []CrawledPage {
	seed, err := url.Parse(seedURL)
	if err != nil {
		log.Printf("[Updater] Invalid seed URL %s: %v", seedURL, err)
		return nil
	}

	client := &http.Client{Timeout: 20 * time.Second}
	queue := []string{seedURL}
	seen := map[string]bool{}
	pages := make([]CrawledPage, 0, maxPages)

	for len(queue) > 0 && len(pages) < maxPages {
		current := queue[0]
		queue = queue[1:]
		if seen[current] {
			continue
		}
		seen[current] = true

		pageURL, err := url.Parse(current)
		if err != nil || pageURL.Host == "" {
			continue
		}
		if !sameHost(seed, pageURL) {
			continue
		}

		req, _ := http.NewRequest(http.MethodGet, current, nil)
		req.Header.Set("User-Agent", "PathSync-AI/1.0")
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("[Updater] Failed to fetch %s: %v", current, err)
			continue
		}

		contentType := resp.Header.Get("Content-Type")
		if !strings.Contains(contentType, "text/html") {
			resp.Body.Close()
			continue
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			log.Printf("[Updater] Failed to read %s: %v", current, err)
			continue
		}

		html := string(body)
		page := CrawledPage{
			URL:   current,
			Title: extractTitle(html),
			Text:  trimText(extractVisibleText(html), 120000),
		}
		pages = append(pages, page)

		for _, link := range extractLinks(html, pageURL) {
			if len(pages)+len(queue) >= maxPages*3 {
				break
			}
			if !sameHost(seed, link) || seen[link.String()] {
				continue
			}
			if isRelevantOfficialLink(link.String()) {
				queue = append(queue, link.String())
			}
		}
	}

	return pages
}

func upsertUniversityFromPage(source OfficialSource, page CrawledPage) *models.University {
	now := time.Now()
	name := source.Name
	if page.Title != "" {
		name = source.Name
	}

	uni := models.University{
		Name:           name,
		Country:        source.Country,
		Region:         regionFromCountry(source.Country),
		Type:           source.Kind,
		Website:        source.Website,
		SourceURL:      page.URL,
		SourceLabel:    fmt.Sprintf("Official source · %s", source.Name),
		SourceType:     source.Kind,
		LastVerifiedAt: now,
		CreatedAt:      now,
	}

	var existing models.University
	// Matched on name alone — not name+website. The hand-curated seed and this
	// source list record different "primary" URLs for the same school (e.g.
	// stanford.edu vs gradadmissions.stanford.edu), so a name+website match
	// missed the existing row and created a second University for it, each
	// with its own world_ranking and program set: the same school appearing
	// twice with different data depending on which row happened to render.
	err := database.DB.Where("LOWER(name) = LOWER(?)", source.Name).First(&existing).Error
	if err == nil {
		existing.Country = uni.Country
		existing.Region = uni.Region
		existing.Type = uni.Type
		existing.SourceURL = uni.SourceURL
		existing.SourceLabel = uni.SourceLabel
		existing.SourceType = uni.SourceType
		existing.LastVerifiedAt = uni.LastVerifiedAt
		database.DB.Save(&existing)
		return &existing
	}
	if err != gorm.ErrRecordNotFound {
		log.Printf("[Updater] Failed to query university %s: %v", source.Name, err)
	}

	uni.ID = uuid.NewString()
	if err := database.DB.Create(&uni).Error; err != nil {
		log.Printf("[Updater] Failed to create university %s: %v", source.Name, err)
		return nil
	}
	return &uni
}

// The free-tier Gemini quota is a rolling per-minute window (confirmed live:
// a 429 cleared on its own after ~50s), not a hard daily cutoff, so a burst
// of 429s should pause calls briefly rather than give up for the rest of the
// run. minExtractionInterval paces outgoing calls to stay under that window
// in the first place; rateLimitCooldownUntil is the reactive fallback when
// pacing alone isn't enough.
const minExtractionInterval = 4 * time.Second

var (
	lastExtractionCallAt   time.Time
	rateLimitCooldownUntil time.Time
	currentGeminiKeyIndex  int
)

// geminiAPIKeys returns every configured Gemini key in rotation order.
// GEMINI_API_KEY_2 is an optional key from a separate account/project used
// purely to add free-tier request budget once the primary key is throttled.
func geminiAPIKeys() []string {
	var keys []string
	if k := strings.TrimSpace(os.Getenv("GEMINI_API_KEY")); k != "" {
		keys = append(keys, k)
	}
	if k := strings.TrimSpace(os.Getenv("GEMINI_API_KEY_2")); k != "" {
		keys = append(keys, k)
	}
	return keys
}

func extractAndStoreFromPage(source OfficialSource, page CrawledPage) {
	if until := rateLimitCooldownUntil; time.Now().Before(until) {
		log.Printf("[Updater] Skipping extraction for %s: still in rate-limit cooldown until %s", source.Name, until.Format(time.RFC3339))
		return
	}

	// A prior run may already have extracted at least one program or
	// scholarship for this university. Free-tier quota is scarce enough that
	// one full crawl can burn most of a day's budget by itself, and the goal
	// right now is breadth -- covering more universities -- not exhaustively
	// re-crawling every page of ones already covered (crawlOfficialPages can
	// discover a different set of page URLs each run, so a per-URL dedup
	// would still re-spend quota on universities that already have data).
	var existingUni models.University
	if err := database.DB.Where("LOWER(name) = LOWER(?)", source.Name).First(&existingUni).Error; err == nil {
		var alreadyExtracted int64
		database.DB.Model(&models.Program{}).Where("university_id = ?", existingUni.ID).Count(&alreadyExtracted)
		if alreadyExtracted == 0 {
			database.DB.Model(&models.Scholarship{}).Where("university_id = ?", existingUni.ID).Count(&alreadyExtracted)
		}
		if alreadyExtracted > 0 {
			return
		}
	}

	var rawText string

	prompt := fmt.Sprintf(`You extract only facts explicitly present in official university pages.
Never invent names, tuition, deadlines, requirements, or scholarships.
If a field is not clearly stated in the page text, leave it empty or null.

Return raw JSON with this exact structure:
{
  "programs": [
    {
      "name": "",
      "degree": "",
      "duration": "",
      "language": "",
      "tuition_per_year": 0,
      "application_fee": 0,
      "min_gpa": 0,
      "min_ielts": 0,
      "min_toefl": 0,
      "work_exp_required": 0,
      "deadline": "",
      "fields": "",
      "program_url": "",
      "source_url": "%s",
      "source_label": "%s"
    }
  ],
  "scholarships": [
    {
      "name": "",
      "coverage": "",
      "amount_per_year": 0,
      "eligible_degrees": "",
      "eligible_fields": "",
      "eligible_nationalities": "",
      "deadline": "",
      "requirements": "",
      "scholarship_url": "",
      "source_url": "%s",
      "source_label": "%s"
    }
  ]
}

Official university name: %s
Page title: %s
Page URL: %s

Page text:
%s`, page.URL, source.Name, page.URL, source.Name, source.Name, page.Title, page.URL, page.Text)

	model := strings.TrimSpace(os.Getenv("UNIVERSITY_CRAWLER_MODEL"))
	if model == "" {
		model = "gemini-3.1-flash-lite" // matches ai-agent-service's default (llm/gemini.go)
	}
	reqBody := OpenAIRequest{
		Model: model,
		Messages: []OpenAIMessage{
			{Role: "user", Content: prompt},
		},
		Temperature: 0.1,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		log.Printf("[Updater] Failed to marshal OpenAI request: %v", err)
		return
	}

	// Uses Gemini's OpenAI-compatibility endpoint rather than a second,
	// separately-billed provider (this crawler used to require
	// OLLAMA_API_KEY, a credential the project never actually had) — same
	// request/response shape as OpenAI's chat completions API, so no other
	// code here needs to change, and it reuses the GEMINI_API_KEY every
	// other AI feature in this project already depends on. A second key
	// (GEMINI_API_KEY_2, a separate free-tier project/account) is optional
	// and lets a 429 rotate to fresh quota instead of just waiting it out.
	apiKeys := geminiAPIKeys()
	if len(apiKeys) == 0 {
		log.Printf("[Updater] GEMINI_API_KEY not configured; skipping extraction for %s", source.Name)
		return
	}
	baseURL := "https://generativelanguage.googleapis.com/v1beta/openai"

	if elapsed := time.Since(lastExtractionCallAt); elapsed < minExtractionInterval {
		time.Sleep(minExtractionInterval - elapsed)
	}

	var bodyBytes []byte
	var statusCode int
	backoffs := []time.Duration{10 * time.Second, 30 * time.Second, 60 * time.Second}
	keysTriedThisRound := 0
	for attempt := 0; ; {
		apiKey := apiKeys[currentGeminiKeyIndex%len(apiKeys)]

		req, _ := http.NewRequest("POST", baseURL+"/chat/completions", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+apiKey)

		lastExtractionCallAt = time.Now()
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			log.Printf("[Updater] Failed to call OpenAI API for %s: %v", source.Name, err)
			return
		}
		statusCode = resp.StatusCode
		bodyBytes, err = io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			log.Printf("[Updater] Failed to read OpenAI response body for %s: %v", source.Name, err)
			return
		}

		if statusCode != 429 {
			break
		}

		keysTriedThisRound++
		if len(apiKeys) > 1 && keysTriedThisRound < len(apiKeys) {
			currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % len(apiKeys)
			log.Printf("[Updater] Key %d rate limited extracting %s; rotating to key %d", keysTriedThisRound, source.Name, currentGeminiKeyIndex+1)
			continue
		}

		keysTriedThisRound = 0
		if attempt >= len(backoffs) {
			rateLimitCooldownUntil = time.Now().Add(90 * time.Second)
			log.Printf("[Updater] Still rate limited on all keys after %d retries; pausing extraction until %s", len(backoffs), rateLimitCooldownUntil.Format(time.RFC3339))
			break
		}
		wait := backoffs[attempt]
		log.Printf("[Updater] All keys rate limited extracting %s (attempt %d/%d); retrying in %s", source.Name, attempt+1, len(backoffs), wait)
		time.Sleep(wait)
		attempt++
	}

	var oResp OpenAIResponse
	if err := json.Unmarshal(bodyBytes, &oResp); err != nil || len(oResp.Choices) == 0 {
		snippet := string(bodyBytes)
		if len(snippet) > 300 {
			snippet = snippet[:300]
		}
		log.Printf("[Updater] Invalid OpenAI response for %s (status %d): %v -- body: %s", source.Name, statusCode, err, snippet)
		return
	}

	rawText = strings.TrimSpace(oResp.Choices[0].Message.Content)
	rawText = cleanMarkdownJSON(rawText)

	var parsed struct {
		Programs     []ExtractedProgram     `json:"programs"`
		Scholarships []ExtractedScholarship `json:"scholarships"`
	}
	if err := json.Unmarshal([]byte(rawText), &parsed); err != nil {
		log.Printf("[Updater] Failed to parse Gemini extraction for %s: %v", source.Name, err)
		return
	}

	uni := ensureUniversityRecord(source, page)
	if uni == nil {
		return
	}

	for _, p := range parsed.Programs {
		if strings.TrimSpace(p.Name) == "" {
			continue
		}
		upsertProgram(*uni, source, page, p)
	}

	for _, s := range parsed.Scholarships {
		if strings.TrimSpace(s.Name) == "" {
			continue
		}
		upsertScholarship(*uni, source, page, s)
	}
}

func ensureUniversityRecord(source OfficialSource, page CrawledPage) *models.University {
	var uni models.University
	err := database.DB.Where("LOWER(name) = LOWER(?)", source.Name).First(&uni).Error
	if err == nil {
		return &uni
	}
	if err != gorm.ErrRecordNotFound {
		log.Printf("[Updater] Failed to query university %s: %v", source.Name, err)
		return nil
	}
	return upsertUniversityFromPage(source, page)
}

func upsertProgram(uni models.University, source OfficialSource, page CrawledPage, p ExtractedProgram) {
	now := time.Now()
	record := models.Program{
		ID:              uuid.NewString(),
		UniversityID:    uni.ID,
		Name:            p.Name,
		Degree:          p.Degree,
		Duration:        p.Duration,
		Language:        p.Language,
		TuitionPerYear:  p.TuitionPerYear,
		ApplicationFee:  p.ApplicationFee,
		MinGPA:          p.MinGPA,
		MinIELTS:        p.MinIELTS,
		MinTOEFL:        p.MinTOEFL,
		WorkExpRequired: p.WorkExpRequired,
		Deadline:        p.Deadline,
		Fields:          p.Fields,
		ProgramURL:      firstNonEmpty(p.ProgramURL, page.URL),
		SourceURL:       page.URL,
		SourceLabel:     fmt.Sprintf("Official source · %s", source.Name),
		LastVerifiedAt:  now,
		CreatedAt:       now,
	}

	existing := models.Program{}
	err := database.DB.Where("university_id = ? AND name = ? AND source_url = ?", uni.ID, p.Name, page.URL).First(&existing).Error
	if err == nil {
		record.ID = existing.ID
		if err := database.DB.Save(&record).Error; err != nil {
			log.Printf("[Updater] Failed to update program %s: %v", p.Name, err)
		}
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("[Updater] Failed to query program %s: %v", p.Name, err)
		return
	}
	if err := database.DB.Create(&record).Error; err != nil {
		log.Printf("[Updater] Failed to create program %s: %v", p.Name, err)
	}
}

func upsertScholarship(uni models.University, source OfficialSource, page CrawledPage, s ExtractedScholarship) {
	now := time.Now()
	record := models.Scholarship{
		ID:                    uuid.NewString(),
		UniversityID:          uni.ID,
		Name:                  s.Name,
		Coverage:              s.Coverage,
		AmountPerYear:         s.AmountPerYear,
		EligibleDegrees:       s.EligibleDegrees,
		EligibleFields:        s.EligibleFields,
		EligibleNationalities: s.EligibleNationalities,
		Deadline:              s.Deadline,
		Requirements:          s.Requirements,
		ScholarshipURL:        firstNonEmpty(s.ScholarshipURL, page.URL),
		SourceURL:             page.URL,
		SourceLabel:           fmt.Sprintf("Official source · %s", source.Name),
		LastVerifiedAt:        now,
		CreatedAt:             now,
	}

	existing := models.Scholarship{}
	err := database.DB.Where("university_id = ? AND name = ? AND source_url = ?", uni.ID, s.Name, page.URL).First(&existing).Error
	if err == nil {
		record.ID = existing.ID
		if err := database.DB.Save(&record).Error; err != nil {
			log.Printf("[Updater] Failed to update scholarship %s: %v", s.Name, err)
		}
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("[Updater] Failed to query scholarship %s: %v", s.Name, err)
		return
	}
	if err := database.DB.Create(&record).Error; err != nil {
		log.Printf("[Updater] Failed to create scholarship %s: %v", s.Name, err)
	}
}

func extractTitle(html string) string {
	re := regexp.MustCompile(`(?is)<title[^>]*>(.*?)</title>`)
	match := re.FindStringSubmatch(html)
	if len(match) < 2 {
		return ""
	}
	return strings.TrimSpace(stripTags(match[1]))
}

func extractVisibleText(html string) string {
	cleaned := regexp.MustCompile(`(?is)<script.*?>.*?</script>|<style.*?>.*?</style>|<noscript.*?>.*?</noscript>|<!--.*?-->`).ReplaceAllString(html, " ")
	cleaned = regexp.MustCompile(`(?is)<(h1|h2|h3|h4|h5|h6|p|li|td|th|a|div|section|article|br|tr|title)[^>]*>`).ReplaceAllString(cleaned, "\n")
	cleaned = regexp.MustCompile(`(?is)<[^>]+>`).ReplaceAllString(cleaned, " ")
	cleaned = strings.ReplaceAll(cleaned, "&nbsp;", " ")
	cleaned = strings.ReplaceAll(cleaned, "&amp;", "&")
	return strings.Join(strings.Fields(cleaned), " ")
}

func extractLinks(html string, base *url.URL) []*url.URL {
	re := regexp.MustCompile(`(?i)href\s*=\s*["']([^"'#]+)["']`)
	matches := re.FindAllStringSubmatch(html, -1)
	links := make([]*url.URL, 0, len(matches))
	for _, match := range matches {
		if len(match) < 2 {
			continue
		}
		ref, err := url.Parse(match[1])
		if err != nil {
			continue
		}
		resolved := base.ResolveReference(ref)
		if resolved.Scheme != "http" && resolved.Scheme != "https" {
			continue
		}
		links = append(links, resolved)
	}
	return links
}

func sameHost(base *url.URL, other *url.URL) bool {
	return strings.EqualFold(base.Hostname(), other.Hostname())
}

func isRelevantOfficialLink(raw string) bool {
	lowered := strings.ToLower(raw)
	keywords := []string{"program", "degree", "admission", "study", "course", "scholarship", "financial-aid", "undergraduate", "graduate", "major", "minor", "fees", "tuition"}
	for _, keyword := range keywords {
		if strings.Contains(lowered, keyword) {
			return true
		}
	}
	return false
}

func trimText(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen]
}

func cleanMarkdownJSON(input string) string {
	cleaned := strings.TrimSpace(input)
	re := regexp.MustCompile("(?s)^```(?:json)?\\s*(.*?)\\s*```$")
	matches := re.FindStringSubmatch(cleaned)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	return cleaned
}

func stripTags(text string) string {
	return regexp.MustCompile(`(?is)<[^>]*>`).ReplaceAllString(text, " ")
}

func regionFromCountry(country string) string {
	switch strings.ToLower(strings.TrimSpace(country)) {
	case "united states", "usa", "us":
		return "northAmerica"
	case "united kingdom", "uk", "england":
		return "europe"
	case "singapore":
		return "asia"
	case "australia":
		return "oceania"
	case "canada":
		return "northAmerica"
	default:
		return "global"
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
