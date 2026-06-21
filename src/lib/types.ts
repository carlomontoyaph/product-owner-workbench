export type StageId =
  | "inbox"
  | "business-need"
  | "requirement-analysis"
  | "discovery"
  | "epic"
  | "user-story"
  | "acceptance-criteria"
  | "readiness"
  | "export";

// kind matches the prototype's stage.kind field
export type StageKind =
  | "inbox"
  | "need"
  | "requirement"
  | "discovery"
  | "epic"
  | "story"
  | "ac"
  | "readiness"
  | "export";

export type StageStatus = "locked" | "ready" | "running" | "review" | "done";

// ── per-stage data shapes (mirror prototype exactly) ──────────────────────────

export interface BusinessNeedData {
  businessProblem: string;
  outcomes: string[];
  successMetrics: string[];
  confidence?: number;
  improvementTips?: string[];
}

export interface RequirementData {
  users: string[];
  goals: string[];
  assumptions: string[];
  constraints: string[];
  openQuestions: string[];
  confidence?: number;
  improvementTips?: string[];
}

export interface DiscoveryQuestion {
  id: string;
  q: string;
  opts: string[];
  origin?: "open" | "edge";
}

export interface DiscoveryData {
  questions: DiscoveryQuestion[];
  confidence?: number;
  improvementTips?: string[];
}

export interface EpicData {
  title: string;
  description: string;
  subFeatures: string[];
  confidence?: number;
  improvementTips?: string[];
}

export interface Story {
  as: string;
  want: string;
  so: string;
}

export interface UserStoryData {
  stories: Story[];
  confidence?: number;
  improvementTips?: string[];
}

export interface AcRow {
  story: Story;
  normal: string[];
  abnormal: string[];
}

export interface AcData {
  rows: AcRow[];
  confidence?: number;
  improvementTips?: string[];
}

export interface ReadinessData {
  refinementScore: number;
  recommendations: string[];
  dependencies: { internal: string[]; external: string[] };
  risk: { level: "Low" | "Medium" | "High"; reasons: string[] };
  estimate: { points: number; rationale: string };
  confidence?: number;
  improvementTips?: string[];
}

export interface InboxData {
  freeText?: string;
}

export type StageData =
  | InboxData
  | BusinessNeedData
  | RequirementData
  | DiscoveryData
  | EpicData
  | UserStoryData
  | AcData
  | ReadinessData
  | null;

// ── copilot ───────────────────────────────────────────────────────────────────

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  stage?: StageId;
}

// ── workbench state ───────────────────────────────────────────────────────────

export interface WorkbenchState {
  current: StageId;
  status: Record<StageId, StageStatus>;
  answers: Record<string, string>; // keyed by question id
  data: Record<StageId, StageData>;
  sourceId: string;
  elapsed: number;
  frozen: boolean;
  live: boolean;
  copilotMessages: CopilotMessage[];
}

// ── API request/response shapes ───────────────────────────────────────────────

export interface StageContext {
  input: string;
  need?: BusinessNeedData | null;
  requirement?: RequirementData | null;
  discovery?: { questions: DiscoveryQuestion[]; answers: { q: string; a: string | null }[] } | null;
  epic?: EpicData | null;
  story?: UserStoryData | null;
  ac?: AcData | null;
}

export interface StageApiRequest {
  stageId: StageId;
  liveAiEnabled: boolean;
  context: StageContext;
}

export interface StageApiResponse {
  success: boolean;
  data?: StageData;
  error?: string;
}
