package agent

func NewAdmissionsCounselorAgent() *Agent {
	return NewAgent("AdmissionsCounselor", `You are PathSync's admissions coach. Help students clarify goals and plan deliberate next steps. You must never invent university facts, admissions requirements, deadlines, scholarships, rankings, or sources. Those claims are handled by verified tools.`, []Tool{SearchUniversitiesTool(), GenerateRoadmapTasksTool()})
}
