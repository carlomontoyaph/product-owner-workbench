import type { StageId, StageKind } from "./types";

export interface StageMetadata {
  id: StageId;
  kind: StageKind;
  name: string;
  skill: string;
  title: string;
  desc: string;
  skillName: string;
  purpose: string;
  io: { in: string; out: string };
  runLabel?: string;
  confirmLabel?: string;
}

export const STAGES: StageMetadata[] = [
  {
    id: "inbox",
    kind: "inbox",
    name: "Requirement Inbox",
    skill: "—",
    title: "Requirement Inbox",
    desc: "Drop raw stakeholder input — free text, meeting notes, Slack, email, or transcripts. Nothing is structured yet; this is the messy starting point.",
    skillName: "intake",
    purpose: "Capture unstructured stakeholder signal from any channel as the single source for the pipeline.",
    io: { in: "Raw text from any channel", out: "Normalized requirement intake" },
    runLabel: "Analyze requirement",
    confirmLabel: "Confirm input · Analyze",
  },
  {
    id: "business-need",
    kind: "need",
    name: "Business Need",
    skill: "business-need-analyzer",
    title: "Business Need",
    desc: "The underlying problem, the outcome we want, and how we'll know it worked — extracted from the raw input.",
    skillName: "business-need-analyzer",
    purpose: "Extract the business problem and desired outcomes (including measurable success criteria) from a stakeholder statement.",
    io: { in: "Stakeholder statement", out: "businessProblem · outcomes[]" },
  },
  {
    id: "requirement-analysis",
    kind: "requirement",
    name: "Requirement Analysis",
    skill: "requirement-analyzer",
    title: "Requirement Analysis",
    desc: "The raw signal, decomposed into the structured dimensions a backlog needs: who, what, what we're assuming, what limits us, and what's still unknown.",
    skillName: "requirement-analyzer",
    purpose: "Convert raw requirements into structured users, goals, assumptions, constraints, and open questions.",
    io: { in: "businessProblem + raw input", out: "users · goals · assumptions · constraints · openQuestions" },
  },
  {
    id: "discovery",
    kind: "discovery",
    name: "Discovery",
    skill: "discovery-question-generator",
    title: "Discovery & Clarification",
    desc: "The system asks only the questions it actually needs to remove ambiguity. Answer them here — each answer measurably sharpens everything downstream.",
    skillName: "discovery-question-generator",
    purpose: "Generate the missing information needed to make the requirement unambiguous: who, why, what, success, constraints, edge cases.",
    io: { in: "Structured requirement", out: "questions[] (with answers)" },
  },
  {
    id: "epic",
    kind: "epic",
    name: "Epic",
    skill: "epic-generator",
    title: "Epic",
    desc: "The clarified need, grouped into a single initiative with its sub-features — the unit a team can plan around.",
    skillName: "epic-generator",
    purpose: "Group related work into a larger initiative with a clear title, description, and sub-features.",
    io: { in: "Requirement + discovery answers", out: "title · description · subFeatures[]" },
  },
  {
    id: "user-story",
    kind: "story",
    name: "User Story",
    skill: "user-story-generator",
    title: "User Story",
    desc: "A set of standardized, vertically-sliced stories in As-a / I-want / So-that form. Order them by priority.",
    skillName: "user-story-generator",
    purpose: "Generate standardized user stories from an epic using the As-a / I-want / So-that template.",
    io: { in: "Epic + sub-features", out: "stories[] (As-a / I-want / So-that)" },
  },
  {
    id: "acceptance-criteria",
    kind: "ac",
    name: "Acceptance Criteria",
    skill: "acceptance-criteria-generator",
    title: "Acceptance Criteria",
    desc: "Testable acceptance criteria for every user story, split into normal (happy-path) and abnormal (edge-case) columns.",
    skillName: "acceptance-criteria-generator",
    purpose: "Generate normal and abnormal acceptance criteria for each user story so 'done' is testable.",
    io: { in: "User stories", out: "rows[] (story · normal[] · abnormal[])" },
  },
  {
    id: "readiness",
    kind: "readiness",
    name: "Refinement & Readiness",
    skill: "refinement · risk · estimation · sprint-readiness",
    title: "Refinement & Sprint Readiness",
    desc: "Four quality skills run as a check, not a gate: backlog refinement, dependencies, risk, and a suggested estimate. The team still owns the final call.",
    skillName: "sprint-readiness-checker",
    purpose: "Score story health, surface dependencies and risk, and suggest an estimate so a story can be judged sprint-ready.",
    io: { in: "Story + acceptance criteria", out: "refinementScore · dependencies · risk · estimate · readiness" },
  },
  {
    id: "export",
    kind: "export",
    name: "Export",
    skill: "—",
    title: "Export Sprint-Ready Artifact",
    desc: "The ambiguity is gone. Hand the structured, refined artifact to wherever the team works — as Markdown, or pushed into a tracker.",
    skillName: "export",
    purpose: "Serialize the full structured artifact to Markdown or push to an external tracker.",
    io: { in: "Full structured artifact", out: "Markdown · Jira · Azure DevOps · Linear" },
  },
];

export const STAGE_IDS = STAGES.map((s) => s.id);

export function getStage(id: StageId): StageMetadata {
  const s = STAGES.find((s) => s.id === id);
  if (!s) throw new Error(`Unknown stage: ${id}`);
  return s;
}

export function stageIndex(id: StageId): number {
  return STAGE_IDS.indexOf(id);
}

export function nextStageId(id: StageId): StageId | null {
  const i = stageIndex(id);
  return i >= 0 && i < STAGES.length - 1 ? STAGE_IDS[i + 1] : null;
}

export function prevStageId(id: StageId): StageId | null {
  const i = stageIndex(id);
  return i > 0 ? STAGE_IDS[i - 1] : null;
}

export const AI_STAGES = new Set<StageId>([
  "business-need",
  "requirement-analysis",
  "discovery",
  "epic",
  "user-story",
  "acceptance-criteria",
  "readiness",
]);

export const EXPORT_TARGETS = [
  { id: "md", name: "Markdown", sub: "Copy or download .md", icon: "markdown" },
  { id: "pdf", name: "PDF", sub: "Sprint artifact · copy-paste ready", icon: "download" },
];
