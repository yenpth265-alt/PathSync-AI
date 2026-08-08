package handlers

import "strings"

// The academic-field taxonomy is deliberately a closed list owned by the
// backend, not free text and not a translation the model invents. Program rows
// store English discipline names, so a Vietnamese major typed by hand ("Khoa
// học máy tính") matched nothing at all before this existed.
//
// Each canonical ID maps to the English terms actually used in the programs
// table, plus the aliases we expect users and older clients to send. The
// frontend renders its own localized labels against the same IDs.
//
// Adding a field means adding one entry here and one label in the frontend's
// fields.js. Keep searchTerms aligned with what the seed data really contains —
// a term that matches no row is worse than no term.
type academicField struct {
	ID          string
	SearchTerms []string
	Aliases     []string
}

var academicFields = []academicField{
	{
		ID:          "computer-science",
		SearchTerms: []string{"Computer Science"},
		Aliases: []string{
			"computer science", "cs", "cntt", "cong nghe thong tin",
			"công nghệ thông tin", "khoa hoc may tinh", "khoa học máy tính",
			"information technology", "computing",
		},
	},
	{
		ID:          "data-science",
		SearchTerms: []string{"Data Science"},
		Aliases: []string{
			"data science", "khoa hoc du lieu", "khoa học dữ liệu",
			"big data", "du lieu lon", "dữ liệu lớn",
		},
	},
	{
		ID:          "ai-ml",
		SearchTerms: []string{"AI", "Machine Learning"},
		Aliases: []string{
			"ai", "artificial intelligence", "machine learning", "ml",
			"tri tue nhan tao", "trí tuệ nhân tạo", "hoc may", "học máy",
		},
	},
	{
		ID:          "software-engineering",
		SearchTerms: []string{"Software Engineering"},
		Aliases: []string{
			"software engineering", "se", "ky thuat phan mem",
			"kỹ thuật phần mềm", "cong nghe phan mem", "công nghệ phần mềm",
		},
	},
	{
		ID:          "statistics",
		SearchTerms: []string{"Statistics"},
		Aliases: []string{
			"statistics", "stats", "thong ke", "thống kê", "toan thong ke",
			"toán thống kê",
		},
	},
	{
		ID:          "robotics",
		SearchTerms: []string{"Robotics"},
		Aliases: []string{
			"robotics", "robot", "ky thuat robot", "kỹ thuật robot",
			"tu dong hoa", "tự động hóa",
		},
	},
}

// resolveFieldSearchTerms turns whatever the client sent in `fields` into the
// English terms to search programs with.
//
// Input may be a canonical ID, an alias, or free text from an older client.
// Recognised values normalize; unrecognised ones pass through unchanged so a
// user searching a discipline we have not catalogued yet still gets a literal
// match rather than silence. Order is preserved and duplicates dropped, so
// callers can safely query each returned term in turn.
//
// ponytail: exact + substring alias match only. If free-text entry comes back
// and users start typing things this misses, that is the point to add fuzzy or
// model-assisted matching — as a fallback for the unmatched case, not a
// replacement for the table.
func resolveFieldSearchTerms(fields []string) []string {
	terms := make([]string, 0, len(fields))
	seen := make(map[string]bool)

	add := func(term string) {
		if term == "" || seen[strings.ToLower(term)] {
			return
		}
		seen[strings.ToLower(term)] = true
		terms = append(terms, term)
	}

	for _, raw := range fields {
		input := strings.ToLower(strings.TrimSpace(raw))
		if input == "" {
			continue
		}

		if field := matchField(input); field != nil {
			for _, term := range field.SearchTerms {
				add(term)
			}
			continue
		}
		add(strings.TrimSpace(raw))
	}
	return terms
}

func matchField(input string) *academicField {
	for i := range academicFields {
		if academicFields[i].ID == input {
			return &academicFields[i]
		}
		for _, alias := range academicFields[i].Aliases {
			if input == alias {
				return &academicFields[i]
			}
		}
	}
	// Substring pass runs only after every exact match has failed, so
	// "Computer Science and Engineering" resolves without letting a short
	// alias like "ai" hijack an input that exactly matches another field.
	for i := range academicFields {
		for _, alias := range academicFields[i].Aliases {
			if len(alias) >= 4 && strings.Contains(input, alias) {
				return &academicFields[i]
			}
		}
	}
	return nil
}
