package updater

import (
	"encoding/json"
	"log"
	"os"
)

type OfficialSource struct {
	Name     string   `json:"name"`
	Country  string   `json:"country"`
	Website  string   `json:"website"`
	SeedURLs []string `json:"seed_urls"`
	Kind     string   `json:"kind"`
}

func DefaultOfficialSources() []OfficialSource {
	return []OfficialSource{
		{
			Name:     "MIT",
			Country:  "United States",
			Website:  "https://www.mit.edu",
			Kind:     "graduate_and_undergraduate",
			SeedURLs: []string{"https://oge.mit.edu/graduate-admissions/programs/", "https://www.mit.edu/admissions-aid/"},
		},
		{
			Name:     "Harvard University",
			Country:  "United States",
			Website:  "https://www.harvard.edu",
			Kind:     "program_catalog",
			SeedURLs: []string{"https://www.harvard.edu/programs/", "https://college.harvard.edu/admissions/apply"},
		},
		{
			Name:     "Stanford University",
			Country:  "United States",
			Website:  "https://gradadmissions.stanford.edu",
			Kind:     "graduate_programs",
			SeedURLs: []string{"https://gradadmissions.stanford.edu/explore-programs"},
		},
		{
			Name:     "National University of Singapore",
			Country:  "Singapore",
			Website:  "https://nus.edu.sg",
			Kind:     "undergraduate_programs",
			SeedURLs: []string{"https://nus.edu.sg/oam/undergraduate-programmes"},
		},
	}
}

func LoadOfficialSources() []OfficialSource {
	raw := os.Getenv("UNIVERSITY_OFFICIAL_SOURCES_JSON")
	if raw == "" {
		return DefaultOfficialSources()
	}

	var sources []OfficialSource
	if err := json.Unmarshal([]byte(raw), &sources); err != nil {
		log.Printf("[Updater] Invalid UNIVERSITY_OFFICIAL_SOURCES_JSON, falling back to defaults: %v", err)
		return DefaultOfficialSources()
	}

	return sources
}
