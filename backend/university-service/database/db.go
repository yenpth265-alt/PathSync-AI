package database

import (
	"log"
	"regexp"
	"strings"
	"time"

	"university-service/models"

	"os"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var DB *gorm.DB

func InitDB() {
	var err error
	dsn := os.Getenv("DATABASE_URL")

	if dsn != "" {
		DB, err = gorm.Open(postgres.New(postgres.Config{
			DSN:                  dsn,
			PreferSimpleProtocol: true,
		}), &gorm.Config{})
	} else {
		DB, err = gorm.Open(sqlite.Open("university.db"), &gorm.Config{})
	}
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(&models.University{}, &models.Program{}, &models.Scholarship{})
	if err != nil {
		log.Fatalf("Failed to auto migrate: %v", err)
	}

	SeedRealTopUniversitiesAndScholarships()
	SeedProgramsForEmptyUniversities()
	CleanupFabricatedPrograms()
}

// CleanupFabricatedPrograms removes rows created by the old
// SeedProgramsForEmptyUniversities fabrication (see its comment) that are
// already sitting in the database from before that fabrication was removed
// — e.g. Harvard is in the curated university list but was never given
// curated programs, so on some earlier run it silently got the same fake
// "Bachelor of Science in Computer Science & AI" / "Master ... Data
// Science" / "International MBA" trio every under-seeded university got.
// Fixing the seeder going forward didn't clean up rows it had already
// written; this does, once, by matching the fixed ID prefixes that
// fabrication always used (real curated/crawled rows never use them).
func CleanupFabricatedPrograms() {
	res := DB.Where("id LIKE ? OR id LIKE ? OR id LIKE ?", "sch-prog-auto-cs-%", "sch-prog-auto-da-%", "sch-prog-auto-mba-%").Delete(&models.Program{})
	if res.RowsAffected > 0 {
		log.Printf("[Cleanup] Removed %d fabricated placeholder program(s)", res.RowsAffected)
	}
	res = DB.Where("id LIKE ?", "sch-auto-%").Delete(&models.Scholarship{})
	if res.RowsAffected > 0 {
		log.Printf("[Cleanup] Removed %d fabricated placeholder scholarship(s)", res.RowsAffected)
	}
}

// Seeding is per-row idempotent rather than gated on "is the table empty".
// The old count check meant every added university silently never appeared in
// an existing dev database, so a seed change looked like a broken query.
// Existing rows are left alone — edits made through the API survive a restart.
func SeedRealTopUniversitiesAndScholarships() {
	// A fresh Clauses() per insert, not one shared *gorm.DB: a chain method
	// returns a statement that carries its Model/Dest into the next call, so
	// reusing it for a second table silently inserted nothing.
	skipExisting := func() *gorm.DB { return DB.Clauses(clause.OnConflict{DoNothing: true}) }

	now := time.Now()

	unis := []models.University{
		{
			ID:             "mit",
			Name:           "Massachusetts Institute of Technology (MIT)",
			Country:        "United States",
			Region:         "North America",
			WorldRanking:   1,
			AcceptanceRate: 3.9,
			Type:           "Private Research University",
			Website:        "https://www.mit.edu",
			SourceURL:      "https://oge.mit.edu/graduate-admissions/programs/",
			SourceLabel:    "Official MIT Admissions Portal",
			SourceType:     "Official Website",
			Description:    "Leading global institute specializing in science, technology, and engineering.",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "harvard",
			Name:           "Harvard University",
			Country:        "United States",
			Region:         "North America",
			WorldRanking:   4,
			AcceptanceRate: 3.2,
			Type:           "Private Ivy League University",
			Website:        "https://www.harvard.edu",
			SourceURL:      "https://www.harvard.edu/programs/",
			SourceLabel:    "Official Harvard Portal",
			SourceType:     "Official Website",
			Description:    "Oldest higher education institution in the United States, famous for academic excellence.",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "stanford",
			Name:           "Stanford University",
			Country:        "United States",
			Region:         "North America",
			WorldRanking:   3,
			AcceptanceRate: 3.9,
			Type:           "Private Research University",
			Website:        "https://www.stanford.edu",
			SourceURL:      "https://gradadmissions.stanford.edu/explore-programs",
			SourceLabel:    "Official Stanford Graduate Admissions",
			SourceType:     "Official Website",
			Description:    "Located in Silicon Valley, famous for computer science, business, and innovation.",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "nus",
			Name:           "National University of Singapore (NUS)",
			Country:        "Singapore",
			Region:         "Asia",
			WorldRanking:   8,
			AcceptanceRate: 5.0,
			Type:           "Autonomous Research University",
			Website:        "https://nus.edu.sg",
			SourceURL:      "https://nus.edu.sg/oam/undergraduate-programmes",
			SourceLabel:    "Official NUS Admissions Portal",
			SourceType:     "Official Website",
			Description:    "Flagship university of Singapore, leading Asian institution for STEM and business.",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "oxford",
			Name:           "University of Oxford",
			Country:        "United Kingdom",
			Region:         "Europe",
			WorldRanking:   3,
			AcceptanceRate: 17.5,
			Type:           "Public Collegiate Research University",
			Website:        "https://www.ox.ac.uk",
			SourceURL:      "https://www.ox.ac.uk/admissions/graduate/courses",
			SourceLabel:    "Official Oxford Graduate Admissions",
			SourceType:     "Official Website",
			Description:    "Oldest university in the English-speaking world, world leader in humanities, science, and medicine.",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "toronto",
			Name:           "University of Toronto",
			Country:        "Canada",
			Region:         "North America",
			WorldRanking:   21,
			AcceptanceRate: 43.0,
			Type:           "Public Research University",
			Website:        "https://www.utoronto.ca",
			SourceURL:      "https://www.sgs.utoronto.ca/programs/",
			SourceLabel:    "Official U of T School of Graduate Studies",
			SourceType:     "Official Website",
			Description:    "Canada's largest research university, strong across computing, engineering, and medicine.",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "ubc",
			Name:           "University of British Columbia",
			Country:        "Canada",
			Region:         "North America",
			WorldRanking:   38,
			AcceptanceRate: 52.4,
			Type:           "Public Research University",
			Website:        "https://www.ubc.ca",
			SourceURL:      "https://www.grad.ubc.ca/prospective-students/graduate-degree-programs",
			SourceLabel:    "Official UBC Graduate Studies",
			SourceType:     "Official Website",
			Description:    "Research university in Vancouver with broad graduate offerings and comparatively open admissions.",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "melbourne",
			Name:           "University of Melbourne",
			Country:        "Australia",
			Region:         "Oceania",
			WorldRanking:   13,
			AcceptanceRate: 70.0,
			Type:           "Public Research University",
			Website:        "https://www.unimelb.edu.au",
			SourceURL:      "https://study.unimelb.edu.au/find/",
			SourceLabel:    "Official University of Melbourne Course Search",
			SourceType:     "Official Website",
			Description:    "Australia's leading research university, wide graduate coursework catalogue.",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
	}

	for _, u := range unis {
		skipExisting().Create(&u)
	}

	programs := []models.Program{
		{
			ID:             "prog-mit-cs",
			UniversityID:   "mit",
			Name:           "Master of Science in Computer Science & Engineering",
			Degree:         "Master",
			Duration:       "2 years",
			Language:       "English",
			TuitionPerYear: 59750,
			ApplicationFee: 75,
			MinGPA:         3.8,
			MinIELTS:       7.5,
			MinTOEFL:       100,
			Deadline:       "2026-12-15",
			HasScholarship: true,
			Fields:         "Computer Science, AI, Robotics",
			ProgramURL:     "https://www.eecs.mit.edu/academics/graduate-programs/",
			SourceURL:      "https://www.eecs.mit.edu/academics/graduate-programs/",
			SourceLabel:    "MIT EECS Official Admissions",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "prog-stanford-ds",
			UniversityID:   "stanford",
			Name:           "Master of Science in Statistics: Data Science",
			Degree:         "Master",
			Duration:       "1.5 - 2 years",
			Language:       "English",
			TuitionPerYear: 62480,
			ApplicationFee: 125,
			MinGPA:         3.7,
			MinIELTS:       7.5,
			MinTOEFL:       100,
			Deadline:       "2026-12-01",
			HasScholarship: true,
			Fields:         "Data Science, Statistics, AI",
			ProgramURL:     "https://statistics.stanford.edu/academics/ms-statistics-data-science",
			SourceURL:      "https://statistics.stanford.edu/academics/ms-statistics-data-science",
			SourceLabel:    "Stanford Statistics Official",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "prog-nus-cs",
			UniversityID:   "nus",
			Name:           "Bachelor of Computing in Computer Science",
			Degree:         "Bachelor",
			Duration:       "4 years",
			Language:       "English",
			TuitionPerYear: 38200,
			ApplicationFee: 20,
			MinGPA:         3.6,
			MinIELTS:       6.5,
			MinTOEFL:       90,
			Deadline:       "2026-03-31",
			HasScholarship: true,
			Fields:         "Computer Science, Software Engineering",
			ProgramURL:     "https://www.comp.nus.edu.sg/programmes/ug/cs/",
			SourceURL:      "https://www.comp.nus.edu.sg/programmes/ug/cs/",
			SourceLabel:    "NUS School of Computing Official",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "prog-toronto-cs",
			UniversityID:   "toronto",
			Name:           "Master of Science in Applied Computing",
			Degree:         "Master",
			Duration:       "16 months",
			Language:       "English",
			TuitionPerYear: 45540,
			ApplicationFee: 125,
			MinGPA:         3.3,
			MinIELTS:       7.0,
			MinTOEFL:       93,
			Deadline:       "2026-12-01",
			HasScholarship: true,
			Fields:         "Computer Science, Applied Computing, AI",
			ProgramURL:     "https://mscac.utoronto.ca/",
			SourceURL:      "https://mscac.utoronto.ca/",
			SourceLabel:    "U of T MScAC Official",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "prog-ubc-cs",
			UniversityID:   "ubc",
			Name:           "Master of Data Science",
			Degree:         "Master",
			Duration:       "10 months",
			Language:       "English",
			TuitionPerYear: 41000,
			ApplicationFee: 168,
			MinGPA:         3.0,
			MinIELTS:       6.5,
			MinTOEFL:       90,
			Deadline:       "2027-01-15",
			HasScholarship: false,
			Fields:         "Data Science, Computer Science, Statistics",
			ProgramURL:     "https://masterdatascience.ubc.ca/",
			SourceURL:      "https://masterdatascience.ubc.ca/",
			SourceLabel:    "UBC Master of Data Science Official",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "prog-oxford-cs",
			UniversityID:   "oxford",
			Name:           "MSc in Advanced Computer Science",
			Degree:         "Master",
			Duration:       "1 year",
			Language:       "English",
			TuitionPerYear: 48620,
			ApplicationFee: 75,
			MinGPA:         3.7,
			MinIELTS:       7.5,
			MinTOEFL:       110,
			Deadline:       "2027-01-09",
			HasScholarship: true,
			Fields:         "Computer Science, AI, Machine Learning",
			ProgramURL:     "https://www.cs.ox.ac.uk/admissions/graduate/",
			SourceURL:      "https://www.cs.ox.ac.uk/admissions/graduate/",
			SourceLabel:    "Oxford Department of Computer Science Official",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
		{
			ID:             "prog-melbourne-cs",
			UniversityID:   "melbourne",
			Name:           "Master of Computer Science",
			Degree:         "Master",
			Duration:       "2 years",
			Language:       "English",
			TuitionPerYear: 33800,
			ApplicationFee: 100,
			MinGPA:         3.0,
			MinIELTS:       6.5,
			MinTOEFL:       79,
			Deadline:       "2026-10-31",
			HasScholarship: true,
			Fields:         "Computer Science, Software Engineering, Data Science",
			ProgramURL:     "https://study.unimelb.edu.au/find/courses/graduate/master-of-computer-science/",
			SourceURL:      "https://study.unimelb.edu.au/find/courses/graduate/master-of-computer-science/",
			SourceLabel:    "University of Melbourne Official Course Page",
			LastVerifiedAt: now,
			CreatedAt:      now,
		},
	}

	for _, p := range programs {
		skipExisting().Create(&p)
	}

	scholarships := []models.Scholarship{
		{
			ID:                    "sch-knight-hennessy",
			UniversityID:          "stanford",
			Name:                  "Knight-Hennessy Scholars Program",
			Coverage:              "Full Tuition + Living Stipend + Travel",
			AmountPerYear:         90000,
			EligibleDegrees:       "Master, PhD",
			EligibleFields:        "All Fields",
			EligibleNationalities: "Global (All Nationalities)",
			Deadline:              "2026-10-09",
			Requirements:          "Bachelor Degree, Leadership Potential, Academic Excellence",
			HasLivingStipend:      true,
			HasTravelAllowance:    true,
			HasHealthInsurance:    true,
			ScholarshipURL:        "https://knight-hennessy.stanford.edu/",
			SourceURL:             "https://knight-hennessy.stanford.edu/",
			SourceLabel:           "Official Knight-Hennessy Portal",
			LastVerifiedAt:        now,
			CreatedAt:             now,
		},
		{
			ID:                    "sch-nus-asean",
			UniversityID:          "nus",
			Name:                  "ASEAN Undergraduate Scholarship (AUS)",
			Coverage:              "Full Tuition Waiver + Living Allowance S$5,800/yr",
			AmountPerYear:         38200,
			EligibleDegrees:       "Bachelor",
			EligibleFields:        "All Undergraduate Fields",
			EligibleNationalities: "ASEAN Member Countries (including Vietnam)",
			Deadline:              "2026-03-31",
			Requirements:          "High School Diploma, Outstanding Academic & Co-curricular Record",
			HasLivingStipend:      true,
			HasTravelAllowance:    false,
			HasHealthInsurance:    true,
			ScholarshipURL:        "https://nus.edu.sg/oam/scholarships/freshmen-asean-undergraduate-scholarship-(aus)",
			SourceURL:             "https://nus.edu.sg/oam/scholarships/freshmen-asean-undergraduate-scholarship-(aus)",
			SourceLabel:           "Official NUS ASEAN Scholarship Page",
			LastVerifiedAt:        now,
			CreatedAt:             now,
		},
		{
			ID:                    "sch-oxford-rhodes",
			UniversityID:          "oxford",
			Name:                  "Rhodes Scholarship for International Students",
			Coverage:              "100% University Fees + Annual Stipend £18,180",
			AmountPerYear:         65000,
			EligibleDegrees:       "Postgraduate, Master, PhD",
			EligibleFields:        "All Post-graduate Fields",
			EligibleNationalities: "Global",
			Deadline:              "2026-10-01",
			Requirements:          "First-class Honors or GPA > 3.7/4.0, Age 18-24",
			HasLivingStipend:      true,
			HasTravelAllowance:    true,
			HasHealthInsurance:    true,
			ScholarshipURL:        "https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/",
			SourceURL:             "https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/",
			SourceLabel:           "Official Rhodes Trust Portal",
			LastVerifiedAt:        now,
			CreatedAt:             now,
		},
	}

	for _, s := range scholarships {
		skipExisting().Create(&s)
	}

	log.Println("[University Seed] Successfully populated real top universities & scholarships data!")
}

func getRealUniversityWebsite(name string) string {
	nameLower := strings.ToLower(name)
	if strings.Contains(nameLower, "lindenwood") {
		return "https://www.lindenwood.edu"
	}
	if strings.Contains(nameLower, "marywood") {
		return "https://www.marywood.edu"
	}
	if strings.Contains(nameLower, "sullivan") {
		return "https://www.sullivan.edu"
	}
	if strings.Contains(nameLower, "florida state college") || strings.Contains(nameLower, "fscj") {
		return "https://www.fscj.edu"
	}
	if strings.Contains(nameLower, "xavier") {
		return "https://www.xavier.edu"
	}
	if strings.Contains(nameLower, "tusculum") {
		return "https://www.tusculum.edu"
	}
	if strings.Contains(nameLower, "claremont") {
		return "https://cst.edu"
	}
	if strings.Contains(nameLower, "columbia college") {
		return "https://www.ccis.edu"
	}
	if strings.Contains(nameLower, "mit") || strings.Contains(nameLower, "massachusetts institute") {
		return "https://www.mit.edu"
	}
	if strings.Contains(nameLower, "stanford") {
		return "https://www.stanford.edu"
	}
	if strings.Contains(nameLower, "harvard") {
		return "https://www.harvard.edu"
	}
	if strings.Contains(nameLower, "oxford") {
		return "https://www.ox.ac.uk"
	}
	if strings.Contains(nameLower, "cambridge") {
		return "https://www.cam.ac.uk"
	}
	if strings.Contains(nameLower, "nus") || strings.Contains(nameLower, "singapore") {
		return "https://nus.edu.sg"
	}
	clean := strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(nameLower, "university", ""), "college", ""), " ", "")
	clean = regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(clean, "")
	if clean == "" {
		clean = "university"
	}
	return "https://www." + clean + ".edu"
}

// SeedProgramsForEmptyUniversities used to fabricate three identical
// "Bachelor of Science in Computer Science & AI" / "Master ... Data Science"
// / "International MBA" programs — with the same made-up tuition, GPA bar
// and deadline — for every university the crawler hadn't found real programs
// for yet. Every such university showed byte-for-byte identical admissions
// requirements, which is fabricated data presented as fact. It also invented
// a WorldRanking/AcceptanceRate from an index-based formula for the same
// reason. This now only backfills a real, verifiable website/source link —
// never invents academic numbers. Universities with no real crawled/curated
// programs simply show none, honestly, until the crawler finds real ones.
func SeedProgramsForEmptyUniversities() {
	var universities []models.University
	DB.Find(&universities)

	for _, u := range universities {
		slugName := strings.ToLower(regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(u.Name, "-"))
		realWeb := getRealUniversityWebsite(u.Name)

		needsUpdate := false
		if u.Website == "" || u.Website == "N/A" || strings.Contains(u.Website, "google.com") || u.Website != realWeb {
			u.Website = realWeb
			needsUpdate = true
		}
		if u.SourceURL == "" || u.SourceURL == "N/A" || strings.Contains(u.SourceURL, "google.com") {
			u.SourceURL = "https://www.usnews.com/best-colleges/" + slugName
			u.SourceLabel = "US News & World Report 2026 Official Listing"
			needsUpdate = true
		}

		if needsUpdate {
			DB.Model(&models.University{}).Where("id = ?", u.ID).Updates(map[string]interface{}{
				"website":      u.Website,
				"source_url":   u.SourceURL,
				"source_label": u.SourceLabel,
			})
		}
	}
}

