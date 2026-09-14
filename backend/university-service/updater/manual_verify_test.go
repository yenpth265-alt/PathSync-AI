package updater

import (
	"encoding/json"
	"os"
	"testing"

	"university-service/database"
	"university-service/models"
)

// TestManualVerifyRealCrawl is not part of the normal test suite (run with
// -run TestManualVerifyRealCrawl explicitly) — it makes real network calls to
// a real university website and a real paid Gemini call, against a
// throwaway local SQLite file. Used once to confirm the Gemini swap in
// extractAndStoreFromPage actually works end-to-end before pointing the
// crawler at every source / at production.
func TestManualVerifyRealCrawl(t *testing.T) {
	// Two separate opt-ins required, not just GEMINI_API_KEY being set — a CI
	// environment can easily have that key present for unrelated reasons,
	// and this test must never fire real network calls to a real university
	// website during an ordinary `go test ./...`.
	if os.Getenv("RUN_LIVE_CRAWL_TEST") != "true" {
		t.Skip("set RUN_LIVE_CRAWL_TEST=true (and GEMINI_API_KEY) to run this live verification")
	}
	if os.Getenv("GEMINI_API_KEY") == "" {
		t.Skip("GEMINI_API_KEY not set; skipping live crawl verification")
	}

	dbFile := "manual_verify.db"
	os.Remove(dbFile)
	t.Cleanup(func() { os.Remove(dbFile) })

	os.Unsetenv("DATABASE_URL") // force the sqlite fallback, never touch production
	database.InitDB()

	sources := LoadOfficialSources()
	var stanford OfficialSource
	found := false
	for _, s := range sources {
		if s.Name == "Stanford University" {
			stanford = s
			found = true
			break
		}
	}
	if !found {
		t.Fatal("Stanford University not found in LoadOfficialSources()")
	}

	for _, seedURL := range stanford.SeedURLs {
		t.Logf("Crawling %s", seedURL)
		pages := crawlOfficialPages(seedURL, 3) // small cap for a quick manual check
		t.Logf("Fetched %d page(s)", len(pages))
		for _, page := range pages {
			upsertUniversityFromPage(stanford, page)
			extractAndStoreFromPage(stanford, page)
		}
	}

	var programCount, scholarshipCount int64
	database.DB.Model(&models.Program{}).Count(&programCount)
	database.DB.Model(&models.Scholarship{}).Count(&scholarshipCount)
	t.Logf("Result: %d program(s), %d scholarship(s) extracted from real Stanford pages", programCount, scholarshipCount)
}

// TestManualVerifyFullCrawl runs the real syncUniversitiesData() pass across
// every configured source against a local SQLite file — never production
// (DATABASE_URL is explicitly unset). This is the actual P2-3 scale check:
// how many real program/scholarship records the crawler produces before
// anyone decides whether to point it at production.
//
// InitDB() (shared with the real service) always opens the local sqlite
// file "university.db" and is never pointed at a throwaway path here, so
// this test's data intentionally persists across runs: extractAndStoreFromPage
// skips a page once it already has stored programs/scholarships for that
// source_url, so re-running this test on a later day (once free-tier quota
// resets) resumes into whatever sources the previous run's quota cutoff left
// uncovered, instead of re-spending quota re-extracting the same first N
// sources every time. Delete backend/university-service/updater/university.db
// manually to force a clean re-crawl of everything.
func TestManualVerifyFullCrawl(t *testing.T) {
	if os.Getenv("RUN_LIVE_CRAWL_TEST") != "true" {
		t.Skip("set RUN_LIVE_CRAWL_TEST=true (and GEMINI_API_KEY) to run this live verification")
	}
	if os.Getenv("GEMINI_API_KEY") == "" {
		t.Skip("GEMINI_API_KEY not set; skipping live crawl verification")
	}

	os.Unsetenv("DATABASE_URL")
	database.InitDB()

	syncUniversitiesData()

	var universities []models.University
	var programs []models.Program
	var scholarships []models.Scholarship
	database.DB.Find(&universities)
	database.DB.Find(&programs)
	database.DB.Find(&scholarships)

	t.Logf("Full crawl result: %d universities, %d programs, %d scholarships",
		len(universities), len(programs), len(scholarships))

	// Snapshot to a real file outside the throwaway sqlite path (which
	// t.Cleanup deletes) so this run's actual data survives to be committed
	// -- a number quoted in the pitch should be countable directly in the
	// repo, not dependent on re-running a live crawl to verify.
	snapshot := struct {
		Universities []models.University  `json:"universities"`
		Programs     []models.Program     `json:"programs"`
		Scholarships []models.Scholarship `json:"scholarships"`
	}{universities, programs, scholarships}

	out, err := json.MarshalIndent(snapshot, "", "  ")
	if err != nil {
		t.Fatalf("failed to marshal snapshot: %v", err)
	}
	if err := os.WriteFile("crawled_snapshot.json", out, 0644); err != nil {
		t.Fatalf("failed to write snapshot: %v", err)
	}
	t.Logf("Wrote crawled_snapshot.json (%d bytes)", len(out))
}
