package agent

import "pathsync-ai-agent-service/llm"

// NewAdmissionsCounselorAgent builds the counselor. A nil llmClient is valid:
// the two tool-backed intents never call a model, and converse degrades
// explicitly rather than fabricating.
func NewAdmissionsCounselorAgent(llmClient llm.Client) *Agent {
	return NewAgent(
		"AdmissionsCounselor",
		`You are PathSync's admissions coach. Help students clarify goals and plan deliberate next steps. You must never invent university facts, admissions requirements, deadlines, scholarships, rankings, or sources. Those claims are handled by verified tools.`,
		[]Tool{SearchUniversitiesTool(), GenerateRoadmapTasksTool()},
		llmClient,
	)
}
