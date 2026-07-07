import type { WorkbenchState, StageContext, DiscoveryQuestion } from "./types";
import { SOURCES } from "./mocks";

// Mirrors buildContext() in app.jsx
export function buildContext(state: WorkbenchState): StageContext {
  const d = state.data ?? {};
  const inboxData = d.inbox as { freeText?: string; inputs?: Record<string, string>; cards?: unknown[] } | null;

  // Handle migration: old sessions with freeText → inputs.free
  let inputs = inboxData?.inputs ?? {};
  if (inboxData?.freeText && !("inputs" in (inboxData ?? {}))) {
    inputs = { free: inboxData.freeText };
  }

  const input = inputs[state.sourceId] ?? "";

  const discoveryData = d.discovery as { questions?: DiscoveryQuestion[] } | null;
  const dq = discoveryData?.questions ?? [];
  const answers = dq.map((q) => ({
    q: q.q,
    a: state.answers[q.id] ?? null,
  }));

  return {
    input,
    contextCards: (inboxData?.cards ?? []) as unknown as StageContext["contextCards"],
    need: (d["business-need"] ?? null) as unknown as StageContext["need"],
    requirement: (d["requirement-analysis"] ?? null) as unknown as StageContext["requirement"],
    discovery: { questions: dq, answers },
    epic: (d.epic ?? null) as unknown as StageContext["epic"],
    story: (d["user-story"] ?? null) as unknown as StageContext["story"],
    ac: (d["acceptance-criteria"] ?? null) as unknown as StageContext["ac"],
  };
}
