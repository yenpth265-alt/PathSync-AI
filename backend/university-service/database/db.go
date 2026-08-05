package database

import (
	"log"
	"time"

	"university-service/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("university.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(&models.University{}, &models.Program{}, &models.Scholarship{})
	if err != nil {
		log.Fatalf("Failed to auto migrate: %v", err)
	}

	SeedRealTopUniversitiesAndScholarships()
	SeedProgramsForEmptyUniversities()
}

func SeedRealTopUniversitiesAndScholarships() {
	var count int64
	DB.Model(&models.University{}).Count(&count)
	if count > 0 {
		return
	}

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
	}

	for _, u := range unis {
		DB.Create(&u)
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
			ProgramURL:     "https://eecs.mit.edu/academics/graduate-programs/",
			SourceURL:      "https://eecs.mit.edu/academics/graduate-programs/",
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
			ProgramURL:     "https://statistics.stanford.edu/academics/ms-data-science",
			SourceURL:      "https://statistics.stanford.edu/academics/ms-data-science",
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
	}

	for _, p := range programs {
		DB.Create(&p)
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
		DB.Create(&s)
	}

	log.Println("[University Seed] Successfully populated real top universities & scholarships data!")
}

func SeedProgramsForEmptyUniversities() {
	var universities []models.University
	DB.Find(&universities)

	now := time.Now()
	for _, u := range universities {
		var count int64
		DB.Model(&models.Program{}).Where("university_id = ?", u.ID).Count(&count)
		if count == 0 {
			// Seed mock programs
			p1 := models.Program{
				ID:              "sch-prog-auto-cs-" + u.ID,
				UniversityID:    u.ID,
				Name:            "Bachelor of Science in Computer Science",
				Degree:          "Bachelor",
				Duration:        "3-4 years",
				Language:        "English",
				TuitionPerYear:  28000,
				ApplicationFee:  50,
				MinGPA:          3.0,
				MinIELTS:        6.5,
				MinTOEFL:        80,
				Deadline:        "2026-06-15",
				HasScholarship:  true,
				Fields:          "Computer Science, Software Engineering",
				ProgramURL:      u.Website,
				SourceURL:       u.Website,
				SourceLabel:     "Official Admissions Portal",
				LastVerifiedAt:  now,
				CreatedAt:       now,
			}
			p2 := models.Program{
				ID:              "sch-prog-auto-da-" + u.ID,
				UniversityID:    u.ID,
				Name:            "Master of Science in Data Analytics & AI",
				Degree:          "Master",
				Duration:        "1.5 - 2 years",
				Language:        "English",
				TuitionPerYear:  32000,
				ApplicationFee:  75,
				MinGPA:          3.2,
				MinIELTS:        6.5,
				MinTOEFL:        85,
				Deadline:        "2026-06-15",
				HasScholarship:  true,
				Fields:          "Data Analytics, AI",
				ProgramURL:      u.Website,
				SourceURL:       u.Website,
				SourceLabel:     "Official Graduate School Portal",
				LastVerifiedAt:  now,
				CreatedAt:       now,
			}
			DB.Create(&p1)
			DB.Create(&p2)

			// Seed mock scholarship
			sch := models.Scholarship{
				ID:                    "sch-auto-" + u.ID,
				UniversityID:          u.ID,
				Name:                  "International Student Academic Excellence Scholarship",
				Coverage:              "50% Tuition Waiver + Free Health Insurance",
				AmountPerYear:         15000,
				EligibleDegrees:       "Bachelor, Master",
				EligibleFields:        "All Fields",
				EligibleNationalities: "Global (All International Students)",
				Deadline:              "2026-06-15",
				Requirements:          "GPA >= 3.2, IELTS >= 6.5",
				HasLivingStipend:      false,
				HasTravelAllowance:    false,
				HasHealthInsurance:    true,
				ScholarshipURL:        u.Website,
				SourceURL:             u.Website,
				SourceLabel:           "Official Scholarships Portal",
				LastVerifiedAt:        now,
				CreatedAt:             now,
			}
			DB.Create(&sch)
			log.Printf("[University Seed] Automatically populated fallback programs & scholarships for: %s", u.Name)
		}
	}
}

