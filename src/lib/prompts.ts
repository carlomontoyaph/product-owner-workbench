import type { StageContext } from "./types";

const J = (o: unknown) => JSON.stringify(o ?? null);

export function getPrompt(stageKind: string, ctx: StageContext): string | null {
  const input = ctx.input ?? "";

  switch (stageKind) {
    case "need":
      return `You are a senior product manager doing backlog refinement. A stakeholder left this raw, possibly messy or vague note:
"""
${input}
"""
Extract the underlying business need. If the note is vague, infer reasonable, specific details and keep every metric measurable.
Rate your confidence (0-100) based on clarity and completeness of the input. Provide up to 3 tips describing what was missing or ambiguous in the user's input that would improve this confidence.
Respond with ONLY minified JSON, no markdown, exactly this shape:
{"businessProblem":"1-2 sentences","outcomes":["3 desired business outcomes"],"successMetrics":["3 measurable success metrics"],"confidence":<0-100 integer>,"improvementTips":["tip 1","tip 2","tip 3"]}`;

    case "requirement":
      return `You are a product manager. Original note:
"""${input}"""
Business need (already extracted): ${J(ctx.need)}
Decompose this into a structured requirement analysis. Open questions must be things genuinely still unresolved.
Rate your confidence (0-100) based on clarity and completeness of the input. Provide up to 3 tips describing what was missing or ambiguous in the user's input that would improve this confidence.
Respond with ONLY minified JSON:
{"users":["3-4 user types"],"goals":["3 goals"],"assumptions":["3 assumptions"],"constraints":["3 constraints"],"openQuestions":["3 unresolved questions"],"confidence":<0-100 integer>,"improvementTips":["tip 1","tip 2","tip 3"]}`;

    case "discovery":
      return `You are a product manager running discovery to remove ambiguity from a vague requirement before it can be built.
Original note: """${input}"""
Open questions so far: ${J(ctx.requirement?.openQuestions)}
Write 3-4 clarifying questions that, once answered, make this buildable. Each MUST be answerable by choosing one short option. Set "origin":"open" if it resolves one of the open questions above, otherwise "edge".
Rate your confidence (0-100) based on clarity and completeness of the input. Provide up to 3 tips describing what was missing or ambiguous in the user's input that would improve this confidence.
Respond with ONLY minified JSON:
{"questions":[{"q":"the question","opts":["2-4 short answer options"],"origin":"open"}],"confidence":<0-100 integer>,"improvementTips":["tip 1","tip 2","tip 3"]}`;

    case "epic":
      return `You are a product manager. Turn the clarified requirement into a single epic.
Note: """${input}"""
Business need: ${J(ctx.need)}
Discovery answers: ${J(ctx.discovery?.answers)}
Rate your confidence (0-100) based on clarity and completeness of the input. Provide up to 3 tips describing what was missing or ambiguous in the user's input that would improve this confidence.
Respond with ONLY minified JSON:
{"title":"short epic title","description":"2-3 sentence description","subFeatures":["4-6 short sub-features"],"confidence":<0-100 integer>,"improvementTips":["tip 1","tip 2","tip 3"]}`;

    case "story":
      return `You are a product manager. Slice this epic into prioritized user stories, highest priority first.
Epic: ${J(ctx.epic)}
Discovery answers: ${J(ctx.discovery?.answers)}
Return 3-4 stories. Each field is a SHORT phrase and must NOT include the words "As a", "I want", or "So that".
Rate your confidence (0-100) based on clarity and completeness of the input. Provide up to 3 tips describing what was missing or ambiguous in the user's input that would improve this confidence.
Respond with ONLY minified JSON:
{"stories":[{"as":"user role","want":"capability","so":"benefit"}],"confidence":<0-100 integer>,"improvementTips":["tip 1","tip 2","tip 3"]}`;

    case "readiness":
      return `You are a delivery lead assessing sprint readiness for this work.
Business need: ${J(ctx.need)}
Stories: ${J(ctx.story?.stories)}
Acceptance criteria cover ${ctx.ac?.rows?.length ?? 0} stories.
Rate your confidence (0-100) based on clarity and completeness of the input. Provide up to 3 tips describing what was missing or ambiguous in the user's input that would improve this confidence.
Respond with ONLY minified JSON:
{"refinementScore":<0-100 integer>,"recommendations":["3 refinement recommendations"],"dependencies":{"internal":["1-2"],"external":["1-2"]},"risk":{"level":"Low|Medium|High","reasons":["2-3 reasons"]},"estimate":{"points":<integer story points>,"rationale":"short rationale"},"confidence":<0-100 integer>,"improvementTips":["tip 1","tip 2","tip 3"]}`;

    default:
      return null;
  }
}

export function getPerStoryAcPrompt(story: { as: string; want: string; so: string }): string {
  return `You are a QA-minded product manager. For this ONE user story, write acceptance criteria.
Story: As a ${story.as}, I want ${story.want}, so that ${story.so}.
Give 1-2 normal (happy-path) and 1-2 abnormal (edge-case/failure) criteria. One sentence each, phrased "Given … when … then …".
Rate your confidence (0-100) based on clarity and completeness of the story. Provide up to 3 tips describing what was missing or ambiguous in the story that would improve this confidence.
Respond with ONLY minified JSON: {"normal":["..."],"abnormal":["..."],"confidence":<0-100 integer>,"improvementTips":["tip 1","tip 2","tip 3"]}`;
}

export function getConfidenceOnlyPrompt(stageKind: string, data: unknown): string {
  return `You are a senior product manager reviewing this "${stageKind}" stage output from a requirement pipeline.

Current output:
${JSON.stringify(data, null, 2)}

Assess the quality of this output. Rate your confidence (0-100) based on specificity, completeness, and actionability. Provide up to 3 concise tips for what is still missing, vague, or could be made more precise. Return an empty array for improvementTips if the output is already high quality.

Respond with ONLY minified JSON: {"confidence":<0-100 integer>,"improvementTips":["tip 1","tip 2"]}`;
}

export function getCopilotSystemPrompt(stageName: string): string {
  return `You are a product management assistant helping a product owner with the "${stageName}" stage of their requirement pipeline. Keep responses concise and practical. Focus on agile best practices, clarity, and sprint-readiness. If asked about specific content, reference what the user shares.`;
}
