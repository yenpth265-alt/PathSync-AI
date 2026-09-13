package handlers

// Prompts live here as named constants so a prompt change is visible in review
// and attributable in an incident (N13). They are formatted with fmt.Sprintf at
// the call site; the %s ordering is documented on each.

// promptSOPAssist: action, essay prompt, current draft.
//
// This prompt is the one guardrail-enforcement layer that used to have no
// "don't ghostwrite" instruction at all (unlike promptEssayReview) — a
// request like action=continue could return several complete paragraphs the
// student could paste in verbatim. The instruction below is reinforced by an
// actual length check on the response, see enforceSOPGuardrail in classic.go;
// prompt text alone is not trusted to hold.
const promptSOPAssist = `You are an admissions essay writing assistant.
Action requested: %s (improve, continue, intro, conclusion)
Essay Prompt: %s
Current Draft Content:
%s

Instructions:
Provide clear, actionable writing suggestions and specific text replacements or additions.
Guardrail: you edit, you do not ghostwrite. "suggestion" must be a short pointer
(2-3 sentences at most) describing what to add or change — never a complete,
publishable paragraph the student could paste in as their own writing. Each
"improvements[].suggested" replacement must stay at phrase/sentence scope,
similar in length to "original" — never expand a short phrase into a full
paragraph, and never draft the whole essay in one response.
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

// extractActionsSchemaPrompt: no placeholders — the document text or file is
// attached separately (see ExtractActions in actions.go), matching the same
// pattern extractCVSchemaPrompt uses.
//
// The one rule this prompt exists to enforce: raw_date_text is copied
// verbatim, never computed or reformatted by the model. Turning that text
// into an actual calendar date happens afterward in parseFlexibleDate
// (dateparse.go) — deterministic Go code, not the LLM. That split is the
// literal mechanism behind the product's "AI chỉ diễn giải, không tự tính
// toán" claim; do not change this prompt to have the model output a
// normalized date without updating that claim too.
const extractActionsSchemaPrompt = `You are extracting application deadlines and required documents from an admissions-related file (an offer letter, a program requirements page, a checklist, an email, etc).

For each distinct deadline or required item you find, extract:
{
  "actions": [
    {
      "title": "Short human-readable name, e.g. 'Submit Statement of Purpose'",
      "category": "one of: sop, transcript, recommendation_letter, test_score, financial_document, visa, application_fee, interview, enrollment_deposit, other",
      "raw_date_text": "the deadline exactly as written in the source, character-for-character, e.g. '15/01/2027', 'January 15, 2027', 'Rolling'. Empty string if this item has no stated date.",
      "evidence_span": "the exact sentence or clause from the document that states this, verbatim, so it can be checked against the source text. Empty string only if you were given nothing but an image/file with no separate extracted text.",
      "ai_confidence": 0.0 to 1.0, your own confidence that this is a genuine, correctly identified deadline and not a guess or hallucination
    }
  ]
}

Rules:
- Copy raw_date_text EXACTLY as written. Do not normalize the format, do not compute a relative date, do not add or infer a year that is not stated in the source.
- If the document states no explicit date for an item (e.g. "rolling admission"), still extract the item with raw_date_text set to that phrase.
- Do not invent items that are not actually mentioned in the document.
- Return ONLY the JSON object above, no other text.`

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
