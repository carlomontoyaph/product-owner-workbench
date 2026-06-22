import type {
  StageKind,
  StageData,
  BusinessNeedData,
  RequirementData,
  DiscoveryData,
  EpicData,
  UserStoryData,
  AcData,
  ReadinessData,
  Story,
} from "@/lib/types";

function trigrams(s: string): Set<string> {
  const norm = s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const result = new Set<string>();
  for (let i = 0; i < norm.length - 2; i++) result.add(norm.slice(i, i + 3));
  return result;
}

function isSimilar(a: string, b: string): boolean {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 || tb.size === 0) return a.toLowerCase() === b.toLowerCase();
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  const jaccard = intersection / (ta.size + tb.size - intersection);
  if (jaccard >= 0.4) return true;
  const smaller = Math.min(ta.size, tb.size);
  return intersection / smaller >= 0.6;
}

function mergeStrArr(existing: string[], incoming: string[]): string[] {
  const result = [...existing];
  for (const item of incoming) {
    if (!result.some((e) => isSimilar(e, item))) result.push(item);
  }
  return result;
}

function storyKey(story: Story): string {
  return `${story.as}|${story.want}|${story.so}`;
}

function mergeNeed(
  existing: BusinessNeedData,
  incoming: BusinessNeedData
): BusinessNeedData {
  return {
    businessProblem: incoming.businessProblem,
    outcomes: mergeStrArr(existing.outcomes ?? [], incoming.outcomes ?? []),
    confidence: incoming.confidence,
    improvementTips: incoming.improvementTips,
  };
}

function mergeRequirement(
  existing: RequirementData,
  incoming: RequirementData
): RequirementData {
  return {
    users: mergeStrArr(existing.users ?? [], incoming.users ?? []),
    goals: mergeStrArr(existing.goals ?? [], incoming.goals ?? []),
    assumptions: mergeStrArr(
      existing.assumptions ?? [],
      incoming.assumptions ?? []
    ),
    constraints: mergeStrArr(
      existing.constraints ?? [],
      incoming.constraints ?? []
    ),
    openQuestions: mergeStrArr(
      existing.openQuestions ?? [],
      incoming.openQuestions ?? []
    ),
    confidence: incoming.confidence,
    improvementTips: incoming.improvementTips,
  };
}

function mergeDiscovery(
  existing: DiscoveryData,
  incoming: DiscoveryData
): DiscoveryData {
  const existingIds = new Set((existing.questions ?? []).map((q) => q.id));
  const result = [...(existing.questions ?? [])];

  for (const q of incoming.questions ?? []) {
    if (!existingIds.has(q.id)) {
      existingIds.add(q.id);
      result.push(q);
    }
  }

  return {
    questions: result,
    confidence: incoming.confidence,
    improvementTips: incoming.improvementTips,
  };
}

function mergeEpic(
  existing: EpicData,
  incoming: EpicData
): EpicData {
  return {
    title: incoming.title,
    description: incoming.description,
    subFeatures: mergeStrArr(
      existing.subFeatures ?? [],
      incoming.subFeatures ?? []
    ),
    confidence: incoming.confidence,
    improvementTips: incoming.improvementTips,
  };
}

function mergeStory(
  existing: UserStoryData,
  incoming: UserStoryData
): UserStoryData {
  const existingKeys = new Set(
    (existing.stories ?? []).map((s) => storyKey(s))
  );
  const result = [...(existing.stories ?? [])];

  for (const story of incoming.stories ?? []) {
    if (!existingKeys.has(storyKey(story))) {
      existingKeys.add(storyKey(story));
      result.push(story);
    }
  }

  return {
    stories: result,
    confidence: incoming.confidence,
    improvementTips: incoming.improvementTips,
  };
}

function mergeAc(
  existing: AcData,
  incoming: AcData
): AcData {
  const existingRowMap = new Map(
    (existing.rows ?? []).map((r) => [storyKey(r.story), r])
  );
  const result = [...(existing.rows ?? [])];
  const processedKeys = new Set<string>();

  for (const row of existing.rows ?? []) {
    processedKeys.add(storyKey(row.story));
  }

  for (const incomingRow of incoming.rows ?? []) {
    const key = storyKey(incomingRow.story);
    const existingRow = existingRowMap.get(key);

    if (existingRow) {
      existingRow.normal = mergeStrArr(
        existingRow.normal ?? [],
        incomingRow.normal ?? []
      );
      existingRow.abnormal = mergeStrArr(
        existingRow.abnormal ?? [],
        incomingRow.abnormal ?? []
      );
    } else if (!processedKeys.has(key)) {
      processedKeys.add(key);
      result.push(incomingRow);
    }
  }

  return {
    rows: result,
    confidence: incoming.confidence,
    improvementTips: incoming.improvementTips,
  };
}

function mergeReadiness(
  existing: ReadinessData,
  incoming: ReadinessData
): ReadinessData {
  return {
    refinementScore: incoming.refinementScore,
    recommendations: mergeStrArr(
      existing.recommendations ?? [],
      incoming.recommendations ?? []
    ),
    dependencies: {
      internal: mergeStrArr(
        existing.dependencies?.internal ?? [],
        incoming.dependencies?.internal ?? []
      ),
      external: mergeStrArr(
        existing.dependencies?.external ?? [],
        incoming.dependencies?.external ?? []
      ),
    },
    risk: {
      level: incoming.risk.level,
      reasons: mergeStrArr(
        existing.risk?.reasons ?? [],
        incoming.risk?.reasons ?? []
      ),
    },
    estimate: {
      points: incoming.estimate.points,
      rationale: incoming.estimate.rationale,
    },
    confidence: incoming.confidence,
    improvementTips: incoming.improvementTips,
  };
}

export function mergeStageData(
  kind: StageKind,
  existing: StageData | undefined | null,
  incoming: StageData
): StageData {
  if (!existing) return incoming;

  switch (kind) {
    case "need":
      return mergeNeed(existing as BusinessNeedData, incoming as BusinessNeedData);
    case "requirement":
      return mergeRequirement(
        existing as RequirementData,
        incoming as RequirementData
      );
    case "discovery":
      return mergeDiscovery(existing as DiscoveryData, incoming as DiscoveryData);
    case "epic":
      return mergeEpic(existing as EpicData, incoming as EpicData);
    case "story":
      return mergeStory(existing as UserStoryData, incoming as UserStoryData);
    case "ac":
      return mergeAc(existing as AcData, incoming as AcData);
    case "readiness":
      return mergeReadiness(
        existing as ReadinessData,
        incoming as ReadinessData
      );
    default:
      return incoming;
  }
}
