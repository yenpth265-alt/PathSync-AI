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
			Name:     "Massachusetts Institute of Technology (MIT)",
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
			Name:     "University of California, Berkeley",
			Country:  "United States",
			Website:  "https://www.berkeley.edu",
			Kind:     "graduate_programs",
			SeedURLs: []string{"https://grad.berkeley.edu/academics/degree-programs/"},
		},
		{
			Name:     "Carnegie Mellon University (CMU)",
			Country:  "United States",
			Website:  "https://www.cmu.edu",
			Kind:     "graduate_programs",
			SeedURLs: []string{"https://www.cmu.edu/academics/programs/index.html"},
		},
		{
			Name:     "University of Oxford",
			Country:  "United Kingdom",
			Website:  "https://www.ox.ac.uk",
			Kind:     "postgraduate_courses",
			SeedURLs: []string{"https://www.ox.ac.uk/admissions/graduate/courses"},
		},
		{
			Name:     "University of Cambridge",
			Country:  "United Kingdom",
			Website:  "https://www.cam.ac.uk",
			Kind:     "postgraduate_courses",
			SeedURLs: []string{"https://www.postgraduate.study.cam.ac.uk/courses"},
		},
		{
			Name:     "Imperial College London",
			Country:  "United Kingdom",
			Website:  "https://www.imperial.ac.uk",
			Kind:     "postgraduate_courses",
			SeedURLs: []string{"https://www.imperial.ac.uk/study/pg/"},
		},
		{
			Name:     "ETH Zurich",
			Country:  "Switzerland",
			Website:  "https://ethz.ch",
			Kind:     "master_degree",
			SeedURLs: []string{"https://ethz.ch/en/studies/master.html"},
		},
		{
			Name:     "Technical University of Munich (TUM)",
			Country:  "Germany",
			Website:  "https://www.tum.de",
			Kind:     "degree_programs",
			SeedURLs: []string{"https://www.tum.de/en/studies/degree-programs"},
		},
		{
			Name:     "National University of Singapore (NUS)",
			Country:  "Singapore",
			Website:  "https://nus.edu.sg",
			Kind:     "undergraduate_programs",
			SeedURLs: []string{"https://nus.edu.sg/oam/undergraduate-programmes"},
		},
		{
			Name:     "Nanyang Technological University (NTU)",
			Country:  "Singapore",
			Website:  "https://www.ntu.edu.sg",
			Kind:     "graduate_programmes",
			SeedURLs: []string{"https://www.ntu.edu.sg/admissions/graduate"},
		},
		{
			Name:     "University of Tokyo",
			Country:  "Japan",
			Website:  "https://www.u-tokyo.ac.jp",
			Kind:     "degree_programs",
			SeedURLs: []string{"https://www.u-tokyo.ac.jp/en/academics/degree_programs.html"},
		},
		{
			Name:     "Kyoto University",
			Country:  "Japan",
			Website:  "https://www.kyoto-u.ac.jp",
			Kind:     "degree_programs",
			SeedURLs: []string{"https://www.kyoto-u.ac.jp/en/education-campus/education-and-admissions"},
		},
		{
			Name:     "University of Melbourne",
			Country:  "Australia",
			Website:  "https://www.unimelb.edu.au",
			Kind:     "courses",
			SeedURLs: []string{"https://study.unimelb.edu.au/find/"},
		},
		{
			Name:     "University of Sydney",
			Country:  "Australia",
			Website:  "https://www.sydney.edu.au",
			Kind:     "courses",
			SeedURLs: []string{"https://www.sydney.edu.au/study/courses.html"},
		},
		{
			Name:     "Monash University",
			Country:  "Australia",
			Website:  "https://www.monash.edu",
			Kind:     "courses",
			SeedURLs: []string{"https://www.monash.edu/study/courses"},
		},
		{
			Name:     "University of Toronto",
			Country:  "Canada",
			Website:  "https://www.utoronto.ca",
			Kind:     "programs",
			SeedURLs: []string{"https://future.utoronto.ca/academics/undergraduate-programs/"},
		},
		{
			Name:     "University of British Columbia (UBC)",
			Country:  "Canada",
			Website:  "https://www.ubc.ca",
			Kind:     "graduate_programs",
			SeedURLs: []string{"https://www.grad.ubc.ca/prospective-students/graduate-degree-programs"},
		},
		{
			Name:     "VinUniversity",
			Country:  "Vietnam",
			Website:  "https://vinuni.edu.vn",
			Kind:     "academic_programs",
			SeedURLs: []string{"https://vinuni.edu.vn/admission/"},
		},
		{
			Name:     "Vietnam National University (VNU)",
			Country:  "Vietnam",
			Website:  "https://vnu.edu.vn",
			Kind:     "admissions",
			SeedURLs: []string{"https://vnu.edu.vn/eng/?C2462"},
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
