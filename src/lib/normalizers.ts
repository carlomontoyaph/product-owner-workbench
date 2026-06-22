import type {
  BusinessNeedData,
  RequirementData,
  DiscoveryData,
  EpicData,
  UserStoryData,
  ReadinessData,
  StageData,
} from "./types";

// Mirrors normalize() in ai.jsx

const arr = (v: unknown): string[] =>
  Array.isArray(v)
    ? (v as unknown[])
        .filter((x) => x != null && String(x).trim() !== "")
        .map((x) => String(x))
    : [];

const str = (v: unknown, d = ""): string => (v == null ? d : String(v));

const clampInt = (v: unknown, lo: number, hi: number, def: number): number => {
  let n = parseInt(String(v), 10);
  if (isNaN(n)) n = def;
  return Math.max(lo, Math.min(hi, n));
};

export function normalizeStage(kind: string, data: Record<string, unknown>): StageData {
  switch (kind) {
    case "need":
      return {
        businessProblem: str(data.businessProblem),
        // Merge successMetrics into outcomes for backward compat with cached data
        outcomes: [...arr(data.outcomes), ...arr(data.successMetrics)],
        confidence: clampInt(data.confidence, 0, 100, 85),
        improvementTips: arr(data.improvementTips).slice(0, 3),
      } satisfies BusinessNeedData;

    case "requirement":
      return {
        users: arr(data.users),
        goals: arr(data.goals),
        assumptions: arr(data.assumptions),
        constraints: arr(data.constraints),
        openQuestions: arr(data.openQuestions),
        confidence: clampInt(data.confidence, 0, 100, 85),
        improvementTips: arr(data.improvementTips).slice(0, 3),
      } satisfies RequirementData;

    case "discovery": {
      const raw = Array.isArray(data.questions) ? (data.questions as Record<string, unknown>[]) : [];
      const questions = raw
        .map((q, i) => ({
          id: "q" + (i + 1),
          q: str(q.q ?? q.question),
          opts: arr(q.opts ?? q.options).slice(0, 4),
          why: str(q.why),
          examples: arr(q.examples).slice(0, 4),
          origin: (q.origin === "edge" ? "edge" : "open") as "open" | "edge",
        }))
        .filter((q) => q.q);
      return {
        questions,
        confidence: clampInt(data.confidence, 0, 100, 85),
        improvementTips: arr(data.improvementTips).slice(0, 3),
      } satisfies DiscoveryData;
    }

    case "epic":
      return {
        title: str(data.title),
        description: str(data.description),
        subFeatures: arr(data.subFeatures),
        confidence: clampInt(data.confidence, 0, 100, 85),
        improvementTips: arr(data.improvementTips).slice(0, 3),
      } satisfies EpicData;

    case "story": {
      const raw = Array.isArray(data.stories) ? (data.stories as Record<string, unknown>[]) : [];
      const stories = raw
        .map((s) => ({
          as: str(s.as).replace(/^as\s+an?\s+/i, ""),
          want: str(s.want).replace(/^i\s+want\s+/i, ""),
          so: str(s.so).replace(/^so\s+that\s+/i, ""),
        }))
        .filter((s) => s.as || s.want || s.so);
      return {
        stories,
        confidence: clampInt(data.confidence, 0, 100, 85),
        improvementTips: arr(data.improvementTips).slice(0, 3),
      } satisfies UserStoryData;
    }

    case "readiness": {
      const dep = (data.dependencies as Record<string, unknown>) || {};
      const risk = (data.risk as Record<string, unknown>) || {};
      const est = (data.estimate as Record<string, unknown>) || {};
      const level = /high/i.test(str(risk.level))
        ? "High"
        : /low/i.test(str(risk.level))
        ? "Low"
        : "Medium";
      return {
        refinementScore: clampInt(data.refinementScore, 0, 100, 70),
        recommendations: arr(data.recommendations),
        dependencies: { internal: arr(dep.internal), external: arr(dep.external) },
        risk: { level: level as "Low" | "Medium" | "High", reasons: arr(risk.reasons) },
        estimate: {
          points: clampInt(est.points, 0, 999, 5),
          rationale: str(est.rationale),
        },
        confidence: clampInt(data.confidence, 0, 100, 85),
        improvementTips: arr(data.improvementTips).slice(0, 3),
      } satisfies ReadinessData;
    }

    default:
      return data as StageData;
  }
}
