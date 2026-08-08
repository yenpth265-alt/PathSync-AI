package handlers

// Prompts live here as named constants so a prompt change is visible in review
// and attributable in an incident (N13). They are formatted with fmt.Sprintf at
// the call site; the %s ordering is documented on each.

// promptSOPAssist: action, essay prompt, current draft.
const promptSOPAssist = `You are an admissions essay writing assistant.
Action requested: %s (improve, continue, intro, conclusion)
Essay Prompt: %s
Current Draft Content:
%s

Instructions:
Provide clear, actionable writing suggestions and specific text replacements or additions.
Return ONLY valid JSON matching this schema:
{
  "suggestion": "Main suggestion or suggested paragraph to add",
  "improvements": [
    {
      "type": "cliche",
      "original": "original phrase",
      "suggested": "better alternative phrase"
    }
  ]
}`

// promptSmartMatch: gpa, ielts, toefl, work_exp, fields, countries, budget, program table.
const promptSmartMatch = `You are an AI Admissions Director matching a student to REAL university programs.
Student Profile:
- GPA: %.2f / 4.0
- IELTS: %.1f, TOEFL: %d
- Work Experience: %d years
- Preferred Fields: %s
- Target Countries: %s
- Annual Budget: $%d

REAL AVAILABLE PROGRAMS IN DATABASE:
%s

Instructions:
Rank ONLY the programs listed above. Never introduce a university or program that
does not appear in the list. Sort into 3 tiers based on student fit:
- "reach": Ambitious, competitive programs
- "target": Well-matched programs where candidate is competitive
- "safe": High probability of admission

Return ONLY valid JSON matching this schema:
{
  "reach": [
    {
      "university": "Exact Uni Name from the list above",
      "program": "Exact Program Name",
      "score": 75,
      "reasons": ["Specific reason 1", "Specific reason 2"]
    }
  ],
  "target": [],
  "safe": []
}`

// promptEssayReview: essay prompt, essay content.
//
// The rubric replaces an uncalibrated /100 score as the thing we ask the model
// for. evidence_span must be quoted verbatim from the essay — it is what makes
// each judgement checkable. advice says what to change; it never contains
// replacement prose, because the product does not write the student's essay.
const promptEssayReview = `You are a senior admissions reader giving formative feedback on an applicant's essay.
Essay Prompt: %s
Applicant's Essay Content:
%s

Instructions:
Assess the essay on four dimensions: theme, specificity, structure, clarity.
For each dimension give a level (emerging, developing, strong), an evidence_span
quoted VERBATIM from the essay, and advice describing what the student should
change. Do NOT rewrite the essay. Do NOT supply replacement sentences. Advice
must describe the change, not perform it.
Return ONLY valid JSON matching this schema:
{
  "score": 85,
  "feedback": "Overall high-level feedback summary",
  "rubric": [
    {
      "dimension": "specificity",
      "level": "developing",
      "evidence_span": "exact quote from the essay",
      "advice": "what to change and why"
    }
  ],
  "issues": [
    {
      "type": "structure",
      "description": "Description of the flaw",
      "suggestion": "Concrete advice on how to fix it"
    }
  ],
  "strengths": ["Key strength 1", "Key strength 2"]
}`
